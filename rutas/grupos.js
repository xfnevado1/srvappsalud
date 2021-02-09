var router = require('express').Router()
var sqlServer = require('./generales')

/*
SELECT [idgrupo]
      ,[nombre]
  FROM [dbo].[grupos]
*/
router.post('/listGroups', function(req, res) {
    let {startRow = 0, pageSize = 10, nombre=""} = req.body

    let params = [ {name: "startRow", tipo:"int", valor: startRow },
                    {name: "pageSize", tipo:"int", valor: pageSize } ]

    let cWhere = "";
    
    if (nombre){
        params.push({name: "nombre", tipo:"varchar", valor: nombre})
        cWhere = " where nombre like '%"+ nombre+"%' "
    }

    let sql =   `Select idgrupo, nombre from grupos ${cWhere} order by idgrupo
                OFFSET @startRow ROWS FETCH NEXT @pageSize ROWS ONLY`
    
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ records: resp.recordset })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/insertGroup', function(req, res) {
    let {nombre} = req.body
    
    let params = [  {name: "nombre", tipo:"varchar", valor: nombre } ]
    let sql = "insert into grupos values( @nombre )"
    
    console.log("el grupo es: ", nombre)
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ status: "success" })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/insertUserGroup', function(req, res) {
    let {idusuario, idgrupo} = req.body
    
    let params = [  {name: "idusuario", tipo:"varchar", valor: idusuario },
                    {name: "idgrupo", tipo:"varchar", valor: idgrupo } ]
    let sql = "insert into grupousuario (idusuario, idgrupo) values( @idusuario, @idgrupo )"
    
    //console.log("usuarios: ",idusuario, idgrupo)
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ status: "success" })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/insertUserCategory', function(req, res) {
    let {idcategoria, idgrupo} = req.body
    
    let params = [  {name: "idcategoria", tipo:"varchar", valor: idcategoria },
                    {name: "idgrupo", tipo:"varchar", valor: idgrupo } ]
    let sql = "insert into grupocategoria (idcategoria, idgrupo) values( @idcategoria, @idgrupo )"
    
    //console.log("usuarios: ",idusuario, idgrupo)
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ status: "success" })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/deleteUserGroup', function(req, res) {
    let {idusuario, idgrupo} = req.body
    
    let params = [  {name: "idusuario", tipo:"varchar", valor: idusuario },
                    {name: "idgrupo", tipo:"varchar", valor: idgrupo } ]
    let sql = "delete from grupousuario where idusuario = @idusuario and idgrupo = @idgrupo "
    
    console.log("usuarios: ",idusuario, idgrupo)
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ status: "success" })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/deleteUserCategory', function(req, res) {
    let {idcategoria, idgrupo} = req.body
    
    let params = [  {name: "idcategoria", tipo:"varchar", valor: idcategoria },
                    {name: "idgrupo", tipo:"varchar", valor: idgrupo } ]
    let sql = "delete from grupocategoria where idcategoria = @idcategoria and idgrupo = @idgrupo "
    
    //console.log("usuarios: ",idusuario, idgrupo)
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ status: "success" })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/deleteGroup', function(req, res) {
    let { idgrupo } = req.body
    
    let params = [  {name: "idgrupo", tipo:"int", valor: idgrupo } ]
    let sql = "delete from grupos where idgrupo = @idgrupo"
    
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ status: "success" })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/modifyGroup', function(req, res) {
    let { idgrupo, nombre } = req.body
    
    let params = [  {name: "idgrupo", tipo:"int", valor: idgrupo },
                    {name: "nombre", tipo:"varchar", valor: nombre } ]
    let sql = "update grupos set nombre = @nombre where idgrupo = @idgrupo"
    
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ status: "success" })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})


router.post('/listGroupUsers', function(req, res) {
    let { startRow = 0, pageSize = 10, idgrupo } = req.body
    
    let params = [  {name: "idgrupo", tipo:"int", valor: idgrupo },
                    {name: "startRow", tipo:"int", valor: startRow },
                    {name: "pageSize", tipo:"int", valor: pageSize } ]
                    
    let sql = `select * from grupos where idgrupo = @idgrupo; 
                select u.idusuario, u.nombres+' '+u.apellidos as nombre
                from grupos g
                inner join grupousuario gu on gu.idgrupo = g.idgrupo
                inner join usuarios u on u.idusuario = gu.idusuario
                where g.idgrupo = @idgrupo
                order by g.idgrupo
                OFFSET @startRow ROWS FETCH NEXT @pageSize ROWS ONLY`
    
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ records: resp.recordsets })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/listGroupCategories', function(req, res) {
    let {startRow = 0, pageSize = 10, idgrupo=0} = req.body

    let params = [ {name: "startRow", tipo:"int", valor: startRow },
                   {name: "pageSize", tipo:"int", valor: pageSize },
                   {name: "idgrupo", tipo:"int", valor: idgrupo },
                ]

        
    let sql =   `Select c.idcategoria, c.nombre from categorias c
                 inner join grupocategoria gc on gc.idcategoria = c.idcategoria
                 and gc.idgrupo = @idgrupo
                 order by idgrupo
                OFFSET @startRow ROWS FETCH NEXT @pageSize ROWS ONLY`
    
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ records: resp.recordset })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/listCategories', function(req, res) {
    let sql =   "Select idcategoria, nombre from categorias where tipo = 0 order by idcategoria"
    sqlServer.sqlQuery(sql).then((resp)=>{
        res.json({ records: resp.recordset })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

module.exports = router