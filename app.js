const http = require('http')
const path = require('path')
const account = require('./config/account')
const express = require('express')
const bodyParser = require('body-parser');
const static = require('serve-static');
const uuid = require('uuid')
const expressJWT = require('express-jwt')
const app = express()                                       // 기본설정.
const jwt = require('./helper/jwtauth')
const db=require('./helper/mysql')
const helper = require('./helper/helper')
const pool = db.pool;


//Swagger 연동
const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

var swaggerDefinition = {
    info: { // API informations (required)
        title: 'Depromeet_Salad API Docs', // Title (required)
        version: '1.0.0', // Version (required)
        description: '기본적으로 모든 api앞에 /api가 붙습니다', // Description (optional)
    },
    host: 'localhost:3000', // Host (optional)
    basePath: '/api', // Base path (optional)
    securityDefinitions: {
        jwt: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
        }
    },
    security: [
        { jwt: [] }
    ]
}

var options = {
    // Import swaggerDefinitions
    swaggerDefinition: swaggerDefinition,
    // Path to the API docs
    apis: ['./routes/api/*.js']
}

const swaggerSpec = swaggerJSDoc(options);

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());                                 // request의 body값을 가져오기 위한 설정

app.use('/public', static(path.join(__dirname, 'public'))); // static 폴더 설정

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(expressJWT({
    secret: account.JWT_SECRET,
    credentialsRequired: false,
    getToken: function fromHeaderOrQuerystring (req) {
     //   console.log(req.headers)
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            return req.query.token;
        }
        return null;
    }
}));

jwt.generate("testid",function(err, accesstoken, refreshtoken){

    console.log(accesstoken)
    jwt.decode

})

app.use((err, req, res, next) => {
    console.log(err)
    if (err.name === "UnauthorizedError") {
        res.status(716).json({
            statusCode: 716,
            statusMsg: "Invalid Token"
        })
    } else if (err.name === "TokenExpiredError") {
        res.json({
            statusCode: 719,
            statusMsg: "Access token expired"
        })
    }
})



app.use("/", require("./routes/routes.js"))
app.use("/api", require("./routes/api"))

app.set('view engine', 'ejs');
app.set('views', './views')                                         // view engine ejs로 설정


http.createServer(app).listen(3001, function(){
    console.log("서버시작")
})