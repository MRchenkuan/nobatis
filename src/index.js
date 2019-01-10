/**
 * 数据库操作代理
 * 通过初始化抽象方法的方式，可以关联到sql文件
 * Created by chenkuan on 2017/4/13.
 */

var path = require('path');
var rf = require("fs");
var orm = require("orm");
var connections;// 数据连接池

/**
 * 数据库连接方法
 * @returns {Promise}
 */
function connectToDB(dbConfig) {
    return new Promise(function (res, rej) {
        if (connections) {
            res(connections);
        } else {
            orm.connect("mysql://" + dbConfig.username + ":" + dbConfig.password + "@" + dbConfig.host + ":" + dbConfig.port + "/", function (err, db) {
                if (err) {
                    console.log(err)
                    rej(err)
                }
                connections = db;
                res(db)
            });
        }
    });
}

/**
 * DAO 实例
 * @param modelPath
 * @returns {Proxy}
 * @constructor
 */
var DAO = function (modelPath, dbConfig) {
    
    return new Proxy({}, {
        get: function (target, funcName, receiver) {
            const _receiver = Reflect.get(target, funcName, receiver);
            if (!_receiver) return console.warn(funcName, 'is not defined in model')
            var sql = getSQL(modelPath, funcName);
            // 获取函数参数表
            var args = getFuncArgs(_receiver);
            // 重设参数
            return function () {
                // 通过执行原函数获取结果表字段映射关系
                var resultMap = _receiver(...args);
                // 参数关系
                var paramsMap = {};
                // 处理参数表与数据间的关系
                for (var i = 0; i < args.length; i++) {
                    paramsMap[args[i]] = arguments[i]
                }
                // 替换sql
                for (let k in paramsMap) {
                    let v = paramsMap[k];
                    v = replaceSpecials(v) // 防止sql注入
                    sql = sql.replace(eval(`/\#\{${k}}/g`), v)
                }
                // 返回promise
                return new Promise(function (res, rej) {
                    connectToDB(dbConfig).then(function (db) {
                        db.driver.execQuery(sql, function (err, dates) {
                            if (err) rej(err);
                            // 判断是否有数据别名需要替换
                            if (resultMap) {
                                replaceColumnAlias(dates, resultMap)
                            }
                            res(dates)
                        });
                    });
                })
            }
        }
    });
};

/**
 * 从文件读取sql
 * @param modelPath
 * @param SQL_FILE_NAME
 * @returns {*}
 */
const sqlCache = {};
function getSQL(modelPath, SQL_FILE_NAME) {
    var filepath = path.resolve(modelPath , SQL_FILE_NAME);
    if (filepath.indexOf('.sql') != filepath.length - 4) filepath += ".sql";
    if (!sqlCache[filepath]) {
        sqlCache[filepath] = rf.readFileSync(filepath, "utf-8");
    }
    return sqlCache[filepath];
}

function replaceSpecials(v) {
    v = v.toString().replace('\'', '');// 防止注入
    v = v.toString().replace('\"', '');// 防止注入
    v = v.toString().replace('\\', '');// 防止注入
    return v
}

/**
 * 获取函数的参数
 * @param func
 * @returns {Array.<*>}
 */
function getFuncArgs(func) {
    // 首先匹配函数括弧里的参数
    var args = func.toString().match(/function\s.*?\(([^)]*)\)/)[1];

    // 分解参数成数组
    return args.split(",").map(function (arg) {
        // 去空格和内联注释
        return arg.replace(/\/\*.*\*\//, "").trim();
    }).filter(function (arg) {
        // 确保没有undefineds
        return arg;
    });
}

/**
 * 将数据查询结果进行列名替换
 * @param dates
 * @param resultMap
 */
function replaceColumnAlias(dates, resultMap) {
    // 遍历整个返回结果
    (dates || []).some(function (it, id) {
        var newObj = {};
        // 遍历每条记录的属性
        for (let k in it) {
            // 若存在别名
            if (resultMap.hasOwnProperty(k)) {
                // 则新建属性，值设为原属性
                let alias = resultMap[k];
                newObj[alias] = it[k];
            } else {
                // 否则直接赋值
                newObj[k] = it[k];
            }
        }
        dates[id] = newObj;
    })

}

/**
 * path sql 文件路径
 * config 数据库配置
 */
module.exports = function(path, dbConfig){
    return new DAO(path, dbConfig);
};
