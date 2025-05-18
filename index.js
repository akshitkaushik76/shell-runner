require('dotenv').config({path:'./config.env'});
const express  = require('express');
const app = express();
const router = require('./routers/Controlrouter');
app.use(express.json());
app.use('/api',router);
app.listen(process.env.PORT,()=>console.log('process started on port',process.env.PORT));
