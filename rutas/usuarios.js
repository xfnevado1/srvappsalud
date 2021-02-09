var router = require('express').Router()
var sqlServer = require('./generales')
var crypto = require('crypto')

/* SELECT TOP (1000) [idusuario]
      ,[username] ,[password] ,[idzona] ,[nombres]
      ,[apellidos] ,[email] ,[telefono] ,[direccion]
      ,[cargo] ,[empresa] ,[tipoidentificacion] ,[identificacion]
      ,[profesion] ,[activo] ,[entidad_id]
  FROM [MedicalHealth].[dbo].[usuarios]
*/

function sha1(data) {
    return crypto.createHash("sha1").update(data, "binary").digest("hex");
}

router.post('/listUsers', function(req, res) {
    let {startRow = 0, pageSize = 10, UserName= "", Nombre="", Apellidos=""} = req.body

    let params = [ {name: "startRow", tipo:"int", valor: startRow },
                    {name: "pageSize", tipo:"int", valor: pageSize } ]

    let cWhere = "";
    //console.log("el sizer: ",pageSize)
    if (UserName){
        params.push({name: "UserName", tipo:"varchar", valor: UserName})
        cWhere = " Where Username ='"+UserName+"'"
    }
    if (Nombre){
        params.push({name: "Nombre", tipo:"varchar", valor: Nombre})
        cWhere = cWhere + ((cWhere!=="")?" and ": "where") + " Nombres ='"+Nombre+"'"
    }
    if (Apellidos){
        params.push({name: "Apellidos", tipo:"varchar", valor: Apellidos})
        cWhere = cWhere + ((cWhere!=="")?" and ": "where") + " Apellidos ='"+Apellidos+"'"
    }    
    // where username = @username and password = @password
    
    let sql =   `Select count(*)/${pageSize} as pagesCount from usuarios ${cWhere};
                Select idusuario, username, nombres+' '+apellidos as nombre, email, 
                 case when activo = 1 then 'Activo' else 'Inactivo' end as activo 
                from usuarios ${cWhere}
                 order by idusuario 
                OFFSET @startRow ROWS FETCH NEXT @pageSize ROWS ONLY`
    
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ records: resp.recordsets })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/recordUser', function(req, res) {
    let {idusuario =""} = req.body

    let sql = "";
    let params = [  {name: "idusuario", tipo:"varchar", valor: idusuario } ]
    
    if (idusuario===""){
        sql = " select idgrupo, nombre, null as idusuario from grupos"
    }
    else{
        sql = "Select idusuario, username, password, idzona, nombres, apellidos ,email ,telefono ,direccion,"+
            " cargo, empresa, tipoidentificacion, identificacion, profesion, activo "+
            " from usuarios where idusuario = @idusuario;"+
            " select g.idgrupo, g.nombre, gu.idusuario from grupos g"+
            " left join grupousuario gu on gu.idgrupo = g.idgrupo and gu.idusuario = @idusuario"

    }

    sqlServer.sqlQuery(sql, params).then((resp)=>{
        if (idusuario===""){
            let record = [[{idusuario:"",username:"", nombres:"", apellidos:"", tipoidentificacion:"C",
                identificacion:"", email:"", telefono:"", direccion:"", cargo:"", empresa:"",
                profesion:"", activo:1, idzona:1}]]
            record.push(resp.recordset)
            res.json({ records: record })
        }
        else {
            res.json({ records: resp.recordsets })
        }
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/getUsersbyName', function(req, res) {
    let {userFind =""} = req.body
    
    let params = [  {name: "userFind", tipo:"varchar", valor: "%"+userFind+"%" } ]
    let sql = "Select top 10 idusuario, username, nombres+' '+apellidos as nombre "+
              "from usuarios where username like @userFind "+
              "or nombres like @userFind "+
              "or apellidos like @userFind ";
    
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ records: (resp.recordset.length)? resp.recordset :"" })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/existUserName', function(req, res) {
    let {username =""} = req.body
    
    let params = [  {name: "username", tipo:"varchar", valor: username } ]
    let sql = "Select idusuario from usuarios where username = @username"
    
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ idusuario: (resp.recordset.length)? resp.recordset[0].idusuario :"" })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/deleteUser', function(req, res) {
    let {idusuario =""} = req.body
    
    let params = [  {name: "idusuario", tipo:"int", valor: idusuario } ]
    let sql = "delete from usuarios where idusuario = @idusuario"
    
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ status: "success" })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/updatePassword', function(req, res) {
    let {idusuario, password} = req.body
    let pass_sha1 = sha1(password)

    let params = [  {name: "idusuario", tipo:"int", valor: idusuario },
                    {name: "password", tipo:"varchar", valor: pass_sha1 } 
                ]
    let sql = "update usuarios set password = @password where idusuario = @idusuario"
    
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ status: "success" })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/updateUser', function(req, res) {
    let {idusuario ="", username= "", nombres="", apellidos="", email="", telefono="", 
        direccion="", cargo="", empresa="", tipoidentificacion="", identificacion="",
        profesion="", activo= 1, idzona = 0, newRecord, grupos
    } = req.body
    
    let params = [  {name: "username", tipo:"varchar", valor: username },
                    {name: "nombres", tipo:"varchar", valor: nombres },
                    {name: "apellidos", tipo:"varchar", valor: apellidos },
                    {name: "email", tipo:"varchar", valor: email },
                    {name: "telefono", tipo:"varchar", valor: telefono },
                    {name: "direccion", tipo:"varchar", valor: direccion },
                    {name: "cargo", tipo:"varchar", valor: cargo },
                    {name: "empresa", tipo:"varchar", valor: empresa },
                    {name: "tipoidentificacion", tipo:"varchar", valor: tipoidentificacion },
                    {name: "identificacion", tipo:"varchar", valor: identificacion },
                    {name: "profesion", tipo:"varchar", valor: profesion },
                    {name: "activo", tipo:"int", valor: activo },
                    {name: "idzona", tipo:"int", valor: idzona },
                ]

    let sql=""
    let arrayQuerys = [];

    if (newRecord === false){
        sql="Insert into usuarios (username, nombres, apellidos, email, telefono, direccion, cargo, empresa, "+  
            "tipoidentificacion, identificacion, profesion, activo, idzona) values ("+
            "@username,  @nombres, @apellidos, @email, @telefono, @direccion, @cargo, @empresa, @tipoidentificacion, "+
            "@identificacion, @profesion, @activo, @idzona)"
            
    }
    else{
        params.push({name: "idusuario", tipo:"int", valor: idusuario})
        sql = "update usuarios set username = @username, nombres = @nombres, apellidos= @apellidos, "+
            "email = @email, telefono = @telefono, direccion = @direccion, cargo = @cargo, empresa= @empresa, "+
            "tipoidentificacion = @tipoidentificacion, identificacion = @identificacion, profesion = @profesion, "+
            "activo = @activo, idzona = @idzona where idusuario = @idusuario"
    }
    let record = Array(sql,params)
    arrayQuerys.push(record)

    /* Eliminar todos los grupos previamente asignados */
    sql = "Delete from grupousuario where idusuario = @idusuario"
    params = [  {name: "idusuario", tipo:"int", valor: idusuario } ]
    arrayQuerys.push(Array(sql,params))

    /* Vamos con los grupos asignados */
    
    grupos.forEach((element, index) => {
        //console.log("elementos :", element)
        sql = "insert into grupousuario (idusuario, idgrupo) values (@idusuario, @idgrupo)"
        let params =[   {name: "idusuario", tipo:"int", valor: idusuario },
                        {name: "idgrupo", tipo:"int", valor: element },
                    ]
        
        arrayQuerys.push(Array(sql,params))
    });
    
    sqlServer.transactionQuery(arrayQuerys).then((resp)=>{
        res.json({ status: "success" })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
                
})
module.exports = router