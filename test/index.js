const DAO = require('../src/index');
const path = require('path');

const modelPath = path.resolve(__dirname,'./model');
const dbConfig = {
    "host": "rds.aliyuncs.com",
    "port": "3306",
    "username": "123456",
    "password": "123456"
};

const dao1 = new DAO(modelPath, dbConfig);
dao1.test = function(){};
console.log(dao1.test())