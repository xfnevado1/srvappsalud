const sql = require("mssql");
const jwt = require('jsonwebtoken');
const async = require("async");

var dbConfig = {
    user:  "sa",
    password: "%zafiro123",
    server: "172.17.1.4",
    database: "MedicalHealth",
    options: {
        "enableArithAbort": true,
        "encrypt": false
    }
};

function Types_SQL(tipo = "varchar"){
    switch (tipo) {
    case "int":
        return sql.Int
    default:
        return sql.VarChar
    }
}

exports.GetJwtToken =(payload)=>{
    let token = jwt.sign({ data:payload }, "Pregunta Secreta", { expiresIn: 60 * 60 })
    //console.log(token)
    return token
}

exports.VerifyJwtToken =(payload)=>{
    return jwt.verify(payload, "Pregunta Secreta",(error, result)=>{
        return (error)?"InvalidToken":"ValidToken"
    })
}

exports.sqlProc = (procedure, params = null) => {
    return new Promise((resolve, reject)=>{
        sql.connect(dbConfig).then((pool)=> {
            //console.log(sql)
            var request = pool.request();
            // verificar los parametros
            if (params && Array.isArray(params)){
                params.forEach ((row)=> {
                    request.input(row.name, Types_SQL(row.tipo), row.valor)
                })
            }
            
            request.execute(procedure).then((resp)=> {
                //console.log("respuesta: ",resp.output[""])
                resolve(resp)
                sql.close();
            }).catch((err) => {
                sql.close();
                reject(err)
                console.log(err);

            });
        }).catch((err)=> {
            reject(err)
            console.log(err);
        }); 
    })
}

exports.sqlQuery = (sqlStatement, params = null) => {
    return new Promise((resolve, reject)=>{
        sql.connect(dbConfig).then((pool)=> {
            //console.log(sql)
            var request = pool.request();
            // verificar los parametros
            if (params && Array.isArray(params)){
                params.forEach ((row)=> {
                    request.input(row.name, Types_SQL(row.tipo), row.valor)
                })
            }
            
            request.query(sqlStatement).then((resp)=> {
                resolve(resp)
                sql.close();
            }).catch((err) => {
                sql.close();
                reject(err)
                console.log(err);
            });
        }).catch((err)=> {
            reject(err)
            console.log(err);
        }); 
    })
}

exports.transactionQuery = (queries) => {
    return new Promise(async (resolve, reject) => {
        const pool = new sql.ConnectionPool(dbConfig);
        await pool.connect();
        const transaction = new sql.Transaction(pool);
        return await transaction.begin((error) => {
            if (error) {
                reject(err);
            }
            return async.eachSeries(queries, async (query, callback) => {
                const request = new sql.Request(transaction);
                let params = query[1];
                //console.log("paramettros:",params)
                if (params && Array.isArray(params)){
                    params.forEach ((row)=> {
                        request.input(row.name, Types_SQL(row.tipo), row.valor)
                    })
                }
                let sqlcmd = query[0];
                //console.log("paramettros:", sqlcmd)
                return request.query(sqlcmd);
            }, async (err2) => {
                if (err2) {
                    transaction.rollback(() => {
                        pool.close();
                        reject(err2);
                    });
                } else {
                    transaction.commit(() => {
                        pool.close();
                        resolve(true);
                    });
                }
            });
        });
    });
}

/*
var statements = ["select 1", "select 2", "select 3"];

var transaction = new sql.Transaction(connection);
transaction.begin(function(err) {
    // ... error checks

    async.mapSeries(statements, function(statement, next) {
        var request = new sql.Request(transaction);
        request.query(statement, next);
    }, function(err, results) {
        // ... error checks

        transaction.commit(function(err, recordset) {
            // ... error checks

            console.log("Transaction commited.");
        });
    });
});
*/