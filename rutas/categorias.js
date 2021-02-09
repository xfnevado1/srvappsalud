var router = require('express').Router()
var sqlServer = require('./generales')

/*
SELECT [idgrupo]
      ,[nombre]
  FROM [dbo].[grupos]
*/
router.post('/listCategories', function(req, res) {
    let {CategoryId = 1} = req.body

    let params = [ {name: "CategoryId", tipo:"int", valor: CategoryId },
                    {name: "IsRoot", tipo:"int", valor: 1 } ]

    sqlServer.sqlProc('CategoryTree_Json', params).then((resp)=>{
        //console.log(resp.output[""])
        res.json(JSON.parse(resp.output[""]))
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/listFathers', function(req, res) {
    let {idcategoria = 0} = req.body

    let params = [ {name: "idcategoria", tipo:"int", valor: idcategoria }]

    let sql =  "Select idcategoria, nombre from categorias where idpadre in (2,3,12)"
    
    if (idcategoria !== 0)
        sql = sql + " and idcategoria <> @idcategoria "

    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ records: resp.recordsets })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
                
})

router.post('/modifyCategory', function(req, res) {
    let { idcategoria, nombre, tipo, padre, componente, icon, path } = req.body
    
    let params = [  
                    {name: "nombre", tipo:"varchar", valor: nombre }, 
                    {name: "idpadre", tipo:"int", valor: padre }, 
                    {name: "componente", tipo:"varchar", valor: componente }, 
                    {name: "icon", tipo:"varchar", valor: icon }, 
                    {name: "path", tipo:"varchar", valor: path }, 
                ]
                
    let sql =""
    //console.log(idcategoria)
    if (idcategoria !== "XXXXX"){
        if (padre === 2 || padre === 3 || padre === 12 ){
            if (tipo === 0){ //es un menu sin submenus en el principal
                tipo = 2;
            }
        }

        sql = "update categorias set nombre = @nombre, tipo = @tipo, idpadre = @idpadre, componente = @componente, icon = @icon, path = @path "+
            "where idcategoria = @idcategoria";
        params.push({name: "idcategoria", tipo:"int", valor: idcategoria })
    }
    else {
        sql = "Insert Into categorias (nombre, tipo, idpadre, componente, icon, path) values(@nombre, @tipo, @idpadre, @componente, @icon, @path) ";
    }

    params.push({name: "tipo", tipo:"int", valor: tipo })
    
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ status: "success" })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

router.post('/deleteCategory', function(req, res) {
    let { idcategoria } = req.body
    
    let params = [  {name: "idcategoria", tipo:"int", valor: idcategoria } ]
    let sql = "delete from categorias where idcategoria = @idcategoria"
    
    sqlServer.sqlQuery(sql, params).then((resp)=>{
        res.json({ status: "success" })
    })
    .catch((error)=>{
        console.log(error)
        res.status(500).send('Something broke!');
    })
})

module.exports = router;