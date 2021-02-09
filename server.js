let express = require('express');
let app = express();
var bodyParser = require('body-parser')
var cors = require('cors')

var router = require('express').Router()

router.use('/login', require("./rutas/login"))
router.use('/usuarios', require("./rutas/usuarios"))
router.use('/grupos', require("./rutas/grupos"))
router.use('/categorias', require("./rutas/categorias"))

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(router)
app.use(function(req, res, next) {
    console.log('** HTTP Error - 404 for request: ' + req.url);
    res.status(404).send('Sorry cant find that!');
});

app.listen(5000, function () {
    console.log('Server is running..');
});