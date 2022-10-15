// Chargement de la bibliothèque express
const express = require('express');
const ejs = require('ejs');
const app = express();
const http = require('http');
const alasql = require('alasql');
const regexp_quote = require("regexp-quote");


app.set('view engine', 'ejs');

//const MongoClient = require('mongodb', {useUnifiedTopology: true}).MongoClient;
const assert = require('assert');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require("helmet");
const morgan = require('morgan')
const path = require('path');
const minify = require('express-minify');
const compression = require('compression')
const ObjectID = require('mongodb').ObjectID;

var idc = 'AB5433FF54678';
var delOld = "";
var num = 0;
var session = require('client-sessions');

var mongo = require('mongodb');
var Server = mongo.Server,
  Db = mongo.Db;
  
var dbo;
var db;

var server = new Server('localhost', 27017, { auto_reconnect: true });
dbo = new Db('engie', server);

dbo.open(function(err, db) {
  if (!err) {
    dbo.authenticate("AdminDbR@@t", "NewPass2015", function(err, res) {
      // callback
      console.log("Connected to 'engie' database");
    });
  }
});


/*MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    db = db;
    dbo = db.db("newhps");
    console.log("Database connected!");
});*/

//app.use(compression());
//app.use(minify());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json({limit: "50mb"}));
//app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(session({
    cookieName: 'session',
    secret: 'PST2ZxghsbJeLNwUnZKNBWkzX7CSJuzXF6VgTK4yubjTV8jeQmbr4a7bkqFbtXvZ5QPYX6VFVMPV7RbUvxtu5EmZGgz5KA2mCL6vmhBXLq5bMEg4Y3bMMHb4DzKhp44T',
    duration: 30 * 60 * 10000,
    activeDuration: 5 * 60 * 10000,
    httpOnly: true,
    secure: true,
    ephemeral: true
}));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "*");
    console.log(req.path);
    next();
});

function requireLogin(req, res, next) {
    console.log("use requireLogin" + JSON.stringify(req.session.user));
    if (!req.session.user) {
        res.render('login', {page: "login"});
    } else {
        next();
    }
};

/*------ planning ----*/
app.get('/restobj/:iduser/:type', function (req, res) {
    console.log("get");
    var iduser = req.params.iduser.toString();
    var vtype = req.params.type.toString();
    var type = [];
    var datas=[];
    var mreq={};
    
    if(vtype=="all")mreq={idcomhps1: iduser};
    else if(vtype=="rdv")mreq={idcomhps1: iduser,$and: [{
      status: {
          $ne: "contact"
      }
  }, {
      status: {
          $ne: "relance"
      }  
  }]};
    else if(vtype=="contact")mreq={status:"contact",idcomhps1: iduser};
    else if(vtype=="leads")mreq={status:"contact"};
    else mreq={status:vtype};
    
    dbo.collection("vacances").find().toArray(function (err, vacances) {
    dbo.collection("events").find(mreq).toArray(function (err, resultev) {
    dbo.collection("commentaires").find({iduser : iduser}).toArray(function (err, commentaires) {  
      console.log(commentaires)
      
      dbo.collection("newhpsrdv").find(mreq).toArray(function (err, result) {

          result.forEach(function (doc) {
            var tmp=doc;
            
            if(doc.dateRdv){
              doc.start = doc.dateRdv.substr(0,10)+"T"+doc.heureRDV+":00";
              if(vtype=="contact")doc.backgroundColor="#fcb103";
              //else doc.backgroundColor="#fcb103";
            } 
            else {  
              doc.start = doc.datepriserdv.substr(0,10)+"T08:00";
              if(vtype=="contact")doc.backgroundColor="#BB8FCE"; 
            }
            
            var dt = new Date(doc.start);
            dt.setHours( dt.getHours() + 1 );
            var datestring = dt.getHours() + ":" + dt.getMinutes();
            doc.end = doc.dateRdv.substr(0,10)+"T"+datestring+":00"; 
            doc.text=doc.nom;
            doc.title=doc.nom;
            doc.id = doc._id.toString();
            //doc.allDay = true;
            
            datas.push(doc);
            var tmp = {"value": doc._id, "id": doc._id, "label": doc.nom, "text": doc.nom};
            type.push(tmp);
          })  
          
          if(vtype=="rdv"){
            resultev.forEach(function (doc) {
            datas.push(doc);  
            })
          }
          
          if(vtype=="all"){
            resultev.forEach(function (doc) {
            datas.push(doc);  
            })
          }
          
          vacances.forEach(function (doc) {
            datas.push(doc);  
          })
          
          if(vtype=="rdv"){
            commentaires.forEach(function (doc) {
              datas.push(doc);  
            })
          }
          var rest = {
                "data": datas,
                "collections": {
                    "clients": type
                }
            }
            
            res.json(rest);
        })
      })
    })  
  })
});


app.post('/restobj/:iduser/:type', function (req, res) {
    console.log("post");
    var myobj = req.body;
    myobj['iduser'] = req.params.iduser.toString();
    myobj['_id'] = new ObjectID();
    myobj['id'] = myobj['_id'];

    dbo.collection("newhpsrdv").save(myobj, function (err, data) {
        if (err) throw err;
        console.log("1 document inserted");  
        //console.log(myobj)
        res.send({action: 'inserted', tid: myobj._id});
    });
});
app.put('/restobj/:iduser/:type/:id', function (req, res) {
    console.log("put");
    var myobj = req.body;  
    var vtype = req.params.type.toString();
    myobj['_id'] = new ObjectID(req.params.id.toString());
    myobj['id'] = myobj['_id'];    
    dbo.collection("newhpsrdv").save(myobj, function (err, data) {
        if (err) throw err;
        console.log("1 document updated");
        res.send({action: 'updated'});
    });

});
app.delete('/restobj/:iduser/:type', function (req, res) {
    var id = req.params.id.toString();
    var mmmd = new ObjectID(id);
    var query = {_id: mmmd};
    console.log("delete");
    dbo.collection("planning").deleteOne(query, function (err, obj) {
        if (err) throw err;
        console.log("1 document deleted");
        res.send({action: 'deleted'});
    })
});
/*------ /planning ----*/

/*----- ROUTES -----*/
app.get('/', requireLogin, function (req, res) {
    res.render('index', {idclient: req.session.user.idclient, page: "index", user: req.session.user});
});
app.get('/login', function (req, res) {
    res.render('login', {page: "login"});
});
app.get('/formio', function (req, res) {
  res.render('formio', {page: "formio"});
});


app.get('/rapports/:iduser',requireLogin, function (req, res) {
	 console.log(req.session.user.idclient)
	 dbo.collection("issues").find({idclient: req.session.user.idclient}).toArray(function (err, result) {

    res.render('rapports', {
        idclient: req.session.user.idclient,
        iduser: req.params.iduser.toString(),
        user: req.session.user,
        issues:result,
        page: "rapports"
    });
  })
    
});

app.get('/raptele/:iduser',requireLogin, function (req, res) {
	dbo.collection("issues").find({idclient: req.session.user.idclient}).toArray(function (err, result) {
    res.render('raptele', {
        idclient: req.session.user.idclient,
        iduser: req.params.iduser.toString(),
        user: req.session.user,
        issues:result,
        page: "raptele"
    });
    });
});

app.get('/params', requireLogin , function (req, res) {
    res.render('params', {idclient: req.session.user.idclient, page: "params", user: req.session.user});
});

app.get('/formbuilder', requireLogin , function (req, res) {
  res.render('formbuilder', {idclient: req.session.user.idclient, page: "formbuilder", user: req.session.user});
});

/*************************/
app.get('/collabs', requireLogin, function (req, res) {
  res.render('collabs', {idclient: req.session.user.idclient, page: "collabs", user: req.session.user});
});
app.get('/cdv', requireLogin, function (req, res) {
  res.render('cdv', {idclient: req.session.user.idclient, page: "cdv", user: req.session.user});
});
app.get('/users', requireLogin , function (req, res) {
    res.render('users', {idclient: req.session.user.idclient, page: "users", user: req.session.user});
});
app.get('/teles', requireLogin, function (req, res) {
    res.render('teles', {idclient: req.session.user.idclient, page: "teles", user: req.session.user});
});
/*************************/
app.get('/newhpsusers/:type', requireLogin, function (req, res) {
  var vtype = req.params.type.toString();
  console.log(req.session.user.idclient)
  res.render('newhpsusers', {idclient: req.session.user.idclient, page: "newhpsusers", user: req.session.user,type:vtype});
});


app.get('/produits', requireLogin, function (req, res) {
    res.render('produits', {idclient: req.session.user.idclient, page: "produits", user: req.session.user});
});
app.get('/clients', requireLogin, function (req, res) {
    res.render('clients', {idclient: req.session.user.idclient, page: "clients", user: req.session.user});
});
app.get('/rdv', requireLogin, function (req, res) {
    res.render('rdv', {idclient: req.session.user.idclient, page: "rdv", user: req.session.user});
});

app.get('/calendarframe/:iduser/:nomcli/:iduser2/:nomcli2/:type', function (req, res) {

  res.render('calendarframe', {
    iduser: req.params.iduser.toString(),
    iduser2: req.params.iduser2.toString(),
    type: req.params.type.toString(),
    user: req.session.user,
    nomcli: req.params.nomcli.toString(),
    nomcli2: req.params.nomcli2.toString(),
    
  });
});
app.get('/calendarframeapp/:iduser/:type/:nomcli', function (req, res) {

  res.render('calendarframeapp', {
    iduser: req.params.iduser.toString(),
    type: req.params.type.toString(),
    user: req.session.user,  
    nomcli: req.params.nomcli.toString(),
    
  });
});
app.get('/planning/:iduser/:ncli/:iduser2/:ncli2', requireLogin, function (req, res) {
    res.render('planning', {
        idclient: req.session.user.idclient,
        iduser: req.params.iduser.toString(),
        nomcli: req.params.ncli.toString(),
        
        iduser2: req.params.iduser2.toString(),
        nomcli2: req.params.ncli2.toString(),
        
        user: req.session.user,
        page: "planning"
    });
});
app.get('/logout', function (req, res) {
	req.session.reset();
	res.redirect('/');
});
app.post('/login', function (req, res) {
	var login = req.body.login.toString();
	var mdp = req.body.mdp.toString();
	dbo.collection("newhpsusers").findOne({email: login, mdp: mdp}, function (err, user) {
		if (!user) {
			console.log("not logged");
			res.render('login', {idclient: idc, page: "login"});
		} else {
			req.session.user = user;
      console.log(user)
			res.redirect('/');
		}
	});


});
/*----- /ROUTES -----*/
//****************************************************//
app.post('/updaterdvapp',function(req, res) {
  var myobj = req.body;
  var mid = new ObjectID(myobj['_id']);
  var forup = myobj;
  delete forup._id;
  //console.log(forup)
  //console.log(mid)
  dbo.collection("newhpsrdv").updateOne({_id: mid}, {$set: forup}, function (err, data) {
      if (err) throw err;
      console.log("1 document updated");
      //console.log(myobj)*/
      res.send({action: 'updated'});
 });

})
//****************************************************//
app.post('/updaterdvappall',function(req, res) {
  var myobj = req.body;
  //console.log(myobj);    
  for (var i = 0; i < myobj.length; i++) {
    
    if(myobj[i]['_id']){
      var mid = new ObjectID(myobj[i]['_id']);
      var forup = myobj[i];
      delete forup._id;
      try {
        if (forup.montant > 0) {
          forup.issue = "VENTE";
        }
      }
      catch (e) {
        console.log(e,"erreur");
      }
      dbo.collection("newhpsrdv").updateOne({_id: mid}, {$set: forup}, function (err, data) {
        if (err) throw err;
        console.log("1 document updated"); 
      })    
    }
    else {
      console.log("save")
      dbo.collection("newhpsrdv").save(myobj[i], function (err, result) {});
      
    }

    
  }
  res.send({action: 'updated'});

})  
//****************************************************//

/*----- API -----*/
app.post('/addobj/:coll', function (req, res) {
    var coll = req.params.coll.toString();
    var myobj = req.body;
    if (myobj['_id'] !== "") myobj['_id'] = new ObjectID(myobj['_id']);
    else myobj['_id'] = new ObjectID();
    console.log(coll);
    dbo.collection(coll).save(myobj, function (err, data) {
        if (err) throw err;
        console.log("1 document inserted");  
        console.log(num++);
        res.send(data);
    });
});
app.get('/loginapp/:col/:email/:mdp', function (req, res) { 
    //req.params.col.toString()
    dbo.collection("newhpsusers").findOne({email:req.params.email.toString(),mdp:req.params.mdp.toString()}, function (err, result) {
        console.log(result)
        if(result)delete result.mdp;
        res.send(result);
    })
})

app.get('/listrdv/:idclient', function (req, res) {
  var idclient = req.params.idclient.toString();
  var mysort = {dateRdv: 1};
  var myrec={};
  if(idclient !="0")myrec={idtel: idclient}
  console.log(myrec);
  dbo.collection("newhpsrdv").find(myrec).sort({dateRdv : -1}).toArray(function (err, result) {
      //console.log(result);
      res.json(result);

  })
})

app.post('/addtoplanning', function (req, res) {
    console.log("post");
    var myobj = req.body;
    myobj['_id'] = new ObjectID();
    myobj['id'] = myobj['_id'];

    dbo.collection("planning").save(myobj, function (err, data) {
        if (err) throw err;
        console.log("1 document inserted");
        //console.log(myobj)
        res.send({action: 'inserted', tid: myobj._id});
    });
});
app.get('/getprod/:idprod', function (req, res) {
    var idprod = req.params.idprod.toString();
    dbo.collection("produits").find({idfamille: idprod}).toArray(function (err, result) {
        res.send(result);
    })
});
app.get('/getclient/:idclient', function (req, res) {
    var idprod = req.params.idclient.toString();
    dbo.collection("clients").find({_id: new ObjectID(idprod)}).toArray(function (err, result) {
        res.send(result);
    })
});
app.get('/list/:coll', function (req, res) {
    var coll = req.params.coll.toString();
    dbo.collection(coll).find().toArray(function (err, result) {
        res.send(result);
    })
});
app.get('/listuser/:coll/:type', function (req, res) {
    var coll = req.params.coll.toString();
    var mtype = req.params.type.toString();
    dbo.collection(coll).find({type: mtype}).toArray(function (err, result) {
        res.send(result);
    })
});
app.get('/listbyid/:coll/:idclient', function (req, res) {
    var coll = req.params.coll.toString();
    var idclient = new ObjectID(req.params.idclient.toString());
    dbo.collection(coll).findOne({_id: idclient}, function (err, result) {
        res.send(result);
    })
});
app.get('/listloc/:idclient', function (req, res) {
    var idclient = req.params.idclient.toString();
    var resp = {};
    var i = 1;
    var type = [];
    dbo.collection("clients").find({idclient: idclient}).toArray(function (err, result) {
        result.forEach(function (doc) {
            var tmp = {"value": doc.nom, "id": doc._id, "label": doc.nom};
            type.push(tmp);
        })
        var str = '{"collections":{"clients":' + JSON.stringify(type) + '}}';
        //console.log(str);
        res.json(JSON.parse(str));

    })
});
app.get('/liststate', function (req, res) {
    const eventTypes = '{"collections":{"state":[{"value":"1","id":"1","label":"Planifié"},{"value":"2","id":"2","label":"En cours"},{"value":"3","id":"3","label":"Terminé"}]}}';
    res.json(JSON.parse(eventTypes));

})
app.get('/listplanning/:idclient', function (req, res) {
    var idclient = req.params.idclient.toString();
    var mysort = {start_date: 1};
    dbo.collection("planning").find({idclient: idclient}).sort(mysort).toArray(function (err, result) {
        //console.log(result);
        res.json(result);

    })
})
app.get('/listrelance/:idclient/:dt', function (req, res) {
  var idclient = req.params.idclient.toString();
  var dt = req.params.dt.toString();
  console.log(dt)
  var mysort = {start_date: 1};
  dbo.collection("newhpsrdv").find({idcomhps1: idclient,status:"relance",daterelance:dt}).toArray(function (err, result) {
      //console.log(result);
      res.json(result);

  })
})
app.get('/listplanningdate/:idclient/:date', function (req, res) {
    var idclient = req.params.idclient.toString();
    var sdate = req.params.date.toString();
    var mysort = {start_date: 1};
    var find = '^' + sdate + '.*';
    var mreg = new RegExp(find, 'i')
    //console.log(mreg)
    dbo.collection("planning").find({
        "start_date": mreg,
        iduser: idclient
    }).sort(mysort).toArray(function (err, result) {
        res.json(result);
    })
})


//select * from newhpsrdv
//where idcomhps1 IN (select * from newhpsusers where idcdv=XXX)
//   or idcomhps2 IN (select * from newhpsusers where idcdv=XXX)

app.get('listrapportscdv',function(req,res){
  dbo.collection("newhpsusers").find(params).sort({"dateRdv": 1}).toArray(function (err, items) {
    var test = items2[0].catalogue;
    resu2 = alasql('SELECT * FROM ? WHERE _id="'+idp+'"',[test]);
  })
})

app.get('/listrapportsdatecdv/:idclient/:dated/:datef/:idtel/:idp',function(req,res){
  //var idp="63345fcfd512fe03c686211b"	
  var idp = req.params.idp.toString();
  var idclient = req.params.idclient.toString();
  var idtel = req.params.idtel.toString();
  var date1 = req.params.dated.toString();
  var date2 = req.params.datef.toString();
  var dataRapport;
  var globTable=[];
  date1 = new Date(date1);
  date2 = new Date(date2);
  date2.setDate(date2.getDate() + 1);
  dbo.collection("newhpsusers").find({idcdv:idp},{"_id":1}).toArray(function (err, items) {
  var test = items;
  let result = test.map(({ _id }) => _id)	

  let param =  {
    "$or": [
    {
      "idcomhps1": {
      "$in": result
      }
    },
    {
      "idcomhps2": {
      "$in": result
      }
    }
    ]
  }
  var pr = JSON.stringify(param)
  dbo.collection("newhpsrdv").find(JSON.parse(pr)).sort({"dateRdv": 1}).toArray(function (err, items2) {
    dataRapport = items2;
    for(var i=0; i < dataRapport.length;i++){
        var dateRapport = new Date(dataRapport[i].dateRdv);
        console.log(date1.getTime())
        if(dateRapport.getTime() >= date1.getTime() && dateRapport.getTime() <= date2.getTime())
            globTable.push(dataRapport[i]);
    }
    res.json(globTable);
  })
  
  })
})

app.get('/listrapportsdate/:idclient/:dated/:datef/:idtel', function (req, res) {
    var idclient = req.params.idclient.toString();
    var idtel = req.params.idtel.toString();
    var date1 = req.params.dated.toString();
    var date2 = req.params.datef.toString();
    var dataRapport;
    var globTable=[];
    date1 = new Date(date1);
    date2 = new Date(date2);
    date2.setDate(date2.getDate() + 1);
    
    var params={};
    if(idclient !=='0'){
      params['idcomhps1'] = idclient;
      params['status'] = "rapport";
    }
    else params['status'] = "rapport";
    if(idtel != "0")params['idtel'] = idtel;

    dbo.collection("newhpsrdv").find(params).sort({"dateRdv": 1}).toArray(function (err, items) {
        dataRapport = items;
        for(var i=0; i < dataRapport.length;i++){
            var dateRapport = new Date(dataRapport[i].dateRdv);
            console.log(date1.getTime())
            if(dateRapport.getTime() >= date1.getTime() && dateRapport.getTime() <= date2.getTime())
                globTable.push(dataRapport[i]);
        }
        res.json(globTable);
    })
})


app.get('/likext/:col/:champ/:val'      ,  function(req, res) {
  var col   =  req.params.col.toString();
  var val   =  req.params.val.toString();
  var champ   =  req.params.champ.toString();
  var re = new RegExp(val, 'i');
  var xx = {};
  xx[champ]={'$regex':val, $options:"i"};
  console.log(xx)
  dbo.collection(col).find(xx).toArray(function(err, items) {
    //  console.log(err)
    res.json(items);
  });
});

app.get('/likextrapport/:champ/:val/:idc' , function (req, res) {
  var val   =  req.params.val.toString();
  var idc   =  req.params.idc.toString();
  var champ   =  req.params.champ.toString();
  var re = new RegExp(val, 'i');
  var xx = {};
  xx[champ]={'$regex':val, $options:"i"};
  xx["idcomhps1"]=idc;
  xx["status"]="rapport";
  console.log(xx)
  dbo.collection("newhpsrdv").find(xx).toArray(function(err, items) {
    res.json(items);
  });
});

app.get('/listcollab', function (req, res) {

    var mysort = {nom: 1};
    var type = [];
    dbo.collection("newhpsusers").find({type : {$ne: "3"}}).sort(mysort).toArray(function (err, result) {
        //console.log(result)
        result.forEach(function (doc) {
            var itm = {id: doc._id, text: doc.nom + " " + doc.prenom};
            type.push(itm);  

        })
        res.json(type);

    })
})
app.get('/listcollabcdv/:idcdv', function (req, res) {

    var mysort = {nom: 1};
    var type = [];
    dbo.collection("newhpsusers").find({idcdv:req.params.idcdv.toString()}).sort(mysort).toArray(function (err, result) {
        //console.log(result)
        result.forEach(function (doc) {
            var itm = {id: doc._id, text: doc.nom + " " + doc.prenom};
            type.push(itm);  
        })
        res.json(type);

    })
})
app.get('/delobj/:coll/:mid', function (req, res) {

    var coll = req.params.coll.toString();
    var mid = req.params.mid.toString(); 
    var mmmd = new ObjectID(mid);
    var query = {_id: mmmd};

    dbo.collection(coll).deleteOne(query, function (err, obj) {
        if (err) throw err;
        console.log("1 document deleted");
        res.sendStatus(200);
    })
});
app.get('/updatefield/:coll/:mid/:field/:val/:def', function (req, res) {
	
	var coll = req.params.coll.toString();
    var field = req.params.field.toString();
    var mid = req.params.mid.toString();
    var val = req.params.val.toString();
    var def = req.params.def.toString();


    var wine = {};
    wine[field] = val;
    
    var wine2 = {};
    wine2[field] = def;

    dbo.collection(coll).updateMany({}, {$set: wine2}, function (err, data) {
	   dbo.collection(coll).updateOne({_id: new ObjectID(mid)}, {$set: wine}, function (err, data) {
        if (err) throw err;
        console.log("1 document updated");
        res.send({action: 'updated'});
        }); 
    });
});
app.post('/updaterapport', function (req, res) {
    var myobj = req.body;
    //console.log(myobj);
    var mid = new ObjectID(myobj['_id']);
    var forup = myobj;
    delete forup._id;
    console.log(forup)
    console.log(mid)
    dbo.collection("planning").updateOne({_id: mid}, {$set: forup}, function (err, data) {
        if (err) throw err;
        console.log("1 document updated");
        console.log(myobj)
        res.send({action: 'updated'});
    });
});
app.post('/updateval/:coll/:field', function (req, res) {
    var coll = req.params.coll.toString();
    var field = req.params.field.toString();
    var myobj = req.body;

    var wine = {};
    wine[field] = myobj[field];
    console.log(wine)
    console.log(myobj);
    dbo.collection("planning").updateOne({_id: new ObjectID(myobj['_id'])}, {$set: wine}, function (err, data) {
        if (err) throw err;
        console.log("1 document updated");
        console.log(myobj)
        res.send({action: 'updated'});
    });

});
app.post('/findclient', function (req, res) {

	dbo.collection("clients").findOne(req.body, function (err, client) {
		res.send(client);

	})

});
app.get('/tpgeoloc', function (req, res) {
    dbo.collection("tpgeoloc").find().toArray(function (err, items) {
	    var valret = {data : items}
        res.send(valret);
    })
});
app.get('/annuaire', function (req, res) {
    dbo.collection("annuaire").find().toArray(function (err, items) {
	    var valret = {data : items}
        res.send(valret);
    })
});

app.get('/clientloc/:lat/:lng/:rad'     , function (req, res) {
  var pLatitude   =  parseFloat(req.params.lat);
  var pLongitude   =  parseFloat(req.params.lng);
  var pDistanceInMeters   =  parseFloat(req.params.rad);
  
  var boundingBox = [];

  var latRadian = (pLatitude * (Math.PI) / 180);

  var degLatKm = 110.574235;
  var degLongKm = 110.572833 * Math.cos(latRadian);
  var deltaLat = pDistanceInMeters / 1000.0 / degLatKm;
  var deltaLong = pDistanceInMeters / 1000.0 / degLongKm;

  var minLat = pLatitude - deltaLat;
  var minLong = pLongitude - deltaLong;
  var maxLat = pLatitude + deltaLat;
  var maxLong = pLongitude + deltaLong;

  var qr={ $and: [ { "lat": { $gt: minLat } }, { "lat": { $lt: maxLat } }, { "long": { $gt: minLong } }, { "long": { $lt: maxLong } } ] }
  
  dbo.collection("clients").find(qr).toArray(function(err, items) {
    
    var ln = JSON.stringify(items)
    console.log(ln.length / 1000) 
    //  console.log(err)
  res.send(items);
  });
}); 
app.get('/listgrenelleapp/:nomc/:nbj',function (req, res) {
  var nomc   = req.params.nomc.toString();
  var nbj = req.params.nbj;
  var mysort = { datepriserdv: 1 };
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate()-nbj);
  console.log("ici")
  dbo.collection("newhpsrdv").find({ $or:[{"idcomhps1": nomc },{ "idcomhps2": nomc}],"dateRdv" : { $gte : tomorrow.toISOString()} }).sort(mysort).toArray(function(err, results) {
    //update lastsynchro et version dans commerciaux
    var mid = new ObjectID(nomc);
    
    //console.log(results);
    
    /*db.collection("commerciaux").updateOne({_id: mid}, {$set: {synchro: new Date()}}, function (err, data) {
      if (err) throw err;
    })  */
    
    res.json(results);	
    })	
}); 

app.get('/getfamille'                   , function (req, res) {
  dbo.collection("produits").distinct("famille",function(err, items){
    res.send(items)
  });
});
app.get('/getproduit/:famille'          , function (req, res) {
  var famille   = req.params.famille.toString();
  dbo.collection("produits").find().toArray(function(err, items) {
    //  console.log(err)
  res.send(items);
  });
});
app.get('/getequipe/:idc/:field', function (req, res) {
  var idc   = req.params.idc.toString();
  var field   = req.params.field.toString();
  var fnd={}
  if(field=="iscdv"){
    fnd={chefvente:idc}
  }
  dbo.collection("commerciaux").find(fnd).toArray(function(err, items) {
    //  console.log(err)
  res.send(items);
  });
});



function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
app.get('/createsample',function (req, res) {
  dbo.collection("newhpsrdv").remove({});
  dbo.collection("grenelles").find().toArray(function(err, results) {
    var out =[];
    for(var i=0;i<23;i++){
      var n= results[getRandomInt(results.length)];
      
      n.idcomhps1= "6033e76872167861bc7ca8c0";
      n.nomcomhps1= "DEMO Client"
      n.idcomhps2= "";
      n.nomcomhps2= ""
      n.issuerdv="";
      n.issue="";
      n.montant="";
      n.mens="";
      n.nbmens="";
      
      if(i<4){
        //Rdv
        var date = new Date();
        n.datepriserdv=date;
        n.dateRdv= new Date().toISOString();
        n.etat=getRandomInt(2);
        n.origine="rdv";
        n.status="rdv";
      }
      else if(i<7){
       // j+1 
       var date = new Date();
       n.datepriserdv=date;
       date.setDate(date.getDate() + 1);
       
       n.dateRdv= date.toISOString();
       
       n.etat=0;  
       n.origine="rdv";
       n.status="rdv";
       }
      else if(i<15){
         //creer j+1..9
         var date = new Date();
         n.datepriserdv=date;
         date.setDate(date.getDate() + (1+getRandomInt(9)));
         n.dateRdv= date.toISOString();
         n.etat=0;  
         n.origine="contact";
         n.status="contact";
         }
      else if(i<22){
            //contact
            var date = new Date();
            n.datepriserdv=date;
            n.dateRdv= date.toISOString();
            n.etat=0;  
            n.origine="contact";
            n.status="contact";
            n.idcomhps1= "";
            n.nomcomhps1= ""
            }
       
      
      dbo.collection("newhpsrdv").save(n, function (err, result) {});
      
      out.push(n);
    }
  
 
  //console.log(results.length);
  //var ln = results.length;
  res.json(out);
  })
});

/*----- /API -----*/

var httpServer = http.createServer(app);
httpServer.listen(91);
console.log("Server connected! port 90");
