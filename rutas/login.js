var router = require('express').Router()
var sqlServer = require('./generales')
var crypto = require('crypto')


function sha1(data) {
    return crypto.createHash("sha1").update(data, "binary").digest("hex");
}

router.post('/signup', function(req, res) {
    let {usuario, password} = req.body
    
    let pass_sha1 = sha1(password)
    //let menuData = [];
    let menuAdmin = [];
    let params = [ {name: "username", tipo:"varchar", valor: usuario },
                    {name: "password", tipo:"varchar", valor: pass_sha1 } ]
    let sql = "Select idusuario, idzona from usuarios where username = @username and password = @password;"+
            "Select * from categorias where idpadre = 12;"
            
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        let idusuario = 0;
        if( resp.recordset.length > 0 ){
            userData =  resp.recordsets[0][0];
            
            if (userData.idzona === 2){
                menuAdmin = resp.recordsets[1];
            }
            else {
                idusuario = userData.idusuario;
            }
        }
        else{
            return res.status(400).send('Usuario Invalido');    
        }

        let paramsx = [  {name: "CategoryId", tipo:"int", valor: 3 },
                        {name: "IsRoot", tipo:"int", valor: 1 },
                        {name: "IdUsuario", tipo:"int", valor: idusuario }  
                    ]
                    
        //console.log("idusuario:",idusuario, "user datra", userData.idusuario)
        sqlServer.sqlProc('CategoryTree_Json', paramsx).then((resp)=>{
            
            // Generar el token
            let token = sqlServer.GetJwtToken(pass_sha1);
            menuUser = JSON.parse(resp.output[""]);
            //console.log("menu:",menuUser)
            //console.log("token:",token)
            res.json({ token: token, menuAdmin, menuUser:menuUser.subRows })
        })
        .catch((error)=>{
            console.log(error)
            res.status(500).send('Something broke!');
        })
    
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    });

})

router.post('/verifyToken', function(req, res) {
    let {token} = req.body
    let newToken = sqlServer.VerifyJwtToken(token)
    //console.log(newToken)
    res.json({ token: newToken })
})

module.exports = router