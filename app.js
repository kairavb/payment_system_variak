// backend code done by Kairav
// #Warning!! 
// Don't touch anything in this file and files under models folder
// even a single mistake could easily break the server 
// unless you know what you are doing, happy coding!!

const express = require('express');
const app = express();
const port = process.env.port || 4000;

// clears console after running for readability || delete this for history
console.clear()

// import static path
app.use('/public', express.static('public'));
// write http://localhost:{port}/public/{resource} to see

// using local modules
const mongoose = require('./db/conn');
const SignupModel = require('./models/signup');
const LoginModel = require('./models/login');
const CardModel = require('./models/card');
const TransModel = require('./models/trans');

// use hbs system
app.set('view engine','hbs');

// for data conversion and readability
app.use(express.json());
app.use(express.urlencoded({extended:false}));

// login session, manual
let login_ip = {};
let login_ip_admin = {};
const admin_name = "admin";
const admin_pass = "admin";
const time_min = 1;
const starting_amount = 2000;

//------routing
app.get("/", (req,res)=>{
    res.render('homepage');
})

app.post("/", (req,res)=>{
    let ip = req.ip;
    delete login_ip[ip];
    delete login_ip_admin[ip];
    res.render('homepage');
})

app.get("/send_money", (req,res)=>{
    res.render('send');
})

app.get("/dashboard_admin", async (req,res)=>{
    let ip = req.ip;
    if (login_ip_admin.hasOwnProperty(ip)){
        var carddetail = await CardModel.find({});
        var signupdetail = await SignupModel.find({});
        var transdetail = await TransModel.find({});
        res.render('dashboard', {cardobj:carddetail, signobj:signupdetail, transobj:transdetail});
    }else{
        res.redirect('login_admin');
    }
})

app.get("/dashboard", async (req,res)=>{
    let ip = req.ip;
    if (login_ip.hasOwnProperty(ip)){
        var carddetail = await CardModel.findOne({uid:login_ip[ip]});
        var transdetail = await TransModel.find({$or: [{ruid:login_ip[ip]}, {suid:login_ip[ip]}]});
        res.render('dashboard_user', {cardobj:carddetail, transobj:transdetail});
    }else{
        res.redirect('login');
    }  
})

app.get("/signup", (req,res)=>{
    res.render('signup');
})

app.get("/login_admin", (req,res)=>{
    res.render('login');
})

app.get("/login", (req,res)=>{
    res.render('login_user');
})

app.post('/send_money', async (req,res)=>{
    let ruid = req.body.uid;
    let card = req.body.card;
    let cvv = req.body.cvv;
    let exp = req.body.exp;
    let amount = Number(req.body.amount);

    if(ruid == '' || card == '' || cvv == '' || exp == '' || amount == ''){
        return res.render('send',{errormsg:'Error, Invalid login details'});
    }

    const userdetail = await CardModel.findOne({cardnumber:card});
    const redetail = await CardModel.findOne({uid:ruid});

    if (userdetail == null || redetail == null){
        return res.render('send',{errormsg:"Could not find User!"});
    }

    let suid = userdetail.uid;
    if (suid == ruid){
        return res.render('send',{errormsg:"You are transferring money to yourself!"});
    }
    
    let tid = suid + String(Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000);
    let time = new Date;
    let today = time.toLocaleDateString();

    let send = userdetail.bal - amount;
    let rec = redetail.bal + amount;

    // updating transaction table
    const TransView = new TransModel({
        transid: tid,
        suid: suid,
        ruid: ruid,
        amount: amount,
        date: today,
        status: "Awaited"
    });
    TransView.save();

    if(userdetail){
        if(userdetail.cvv == cvv && userdetail.exp == exp && amount <= userdetail.bal){
            // transaction happening here
            await CardModel.updateOne({cardnumber:card},{$set:{bal:send}});
            await CardModel.updateOne({uid:ruid},{$set:{bal:rec}});
            await TransModel.updateOne({transid:tid},{$set:{status:"Completed"}});
        }else{
            await TransModel.updateOne({transid:tid},{$set:{status:"Denied"}});
            return res.render('send',{errormsg:"Details does not match or Amount exceeds Balance!"});
        }
    }else{
        await TransModel.updateOne({transid:tid},{$set:{status:"Denied"}});
        return res.render('send',{errormsg:"Could not find User!"});
    }
    res.render('send',{code:"Payment Done!"});
});


// transferring data, signup ==> database
app.post('/signup',async (req,res)=>{

    // checks for duplicate users
    let mail = req.body.email;
    let pass = req.body.pass;
    let name = req.body.name;
    let mobile = req.body.mobile;

    if(mail == '' || pass == '' || name == '' || mobile == ''){
        return res.render('signup',{errormsg:'Error, Invalid login details'});
    }
    const mailid = await SignupModel.findOne({email:mail});
    if(mailid != null){return res.render('signup',{errormsg:'Error, User already exists!!'});}

    // generate card details
    var uid = mail.split('@')[0];
    var cv = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
    var cardnum = Math.floor(Math.random() * (99999999999 - 10000000000 + 1)) + 10000000000;
    var time = new Date;
    var today = time.toLocaleDateString();
    var exp = Number(String(time.getMonth() + 1) + String(time.getFullYear()%100 + 4));

    // saves login detials to database
    const SignupView = new SignupModel({
        uid: uid,
        email: mail,
        pass: pass,
        name: name,
        mobile: mobile,
        date: today
    });
    SignupView.save();

    // save generated card details to database
    const CardView = new CardModel({
        uid: uid,
        cardnumber: cardnum,
        cvv: cv,
        exp: exp,
        bal: starting_amount
    });
    CardView.save();

    // send card details to user mail || one time
    let send_text = String(
    "alert('unique ID: " + uid +
    "\\ncardnumber: " + cardnum +
    "\\ncvv: " +  cv +
    "\\nexp: " +  String(exp).slice(0, 2) + "/" + String(exp).slice(2, 4) +
    "\\nnote these details for loging in')");

    res.render('signup',{code:send_text});
});


// comparing admin login data
app.post('/login_admin',async (req,res)=>{

    // creating admin db if not already created
    const admin_exist = await LoginModel.findOne({name:admin_name});
    if (admin_exist == null){
        const LoginView = new LoginModel({
            name:admin_name,
            pass:admin_pass
        });
        LoginView.save();
    }

    const username = req.body.username;
    const password = req.body.password;
    const userdetail = await LoginModel.findOne({name:username});
    if(userdetail){
        if(userdetail.pass == password){
            login_ip_admin[req.ip] = username;
            res.redirect('dashboard_admin');
        }else{
            res.render('login',{errormsg:'Error, incorrect ID or Password'});
        }
    }else{
        res.render('login',{errormsg:'Error, incorrect ID or Password'});
    }
});


// comparing user login data
app.post('/login',async (req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
    const userdetail = await SignupModel.findOne({uid:username});
    if(userdetail){
        if(userdetail.pass==password){
            login_ip[req.ip] = username;
            // setTimeout(delete login_ip.req.ip, 1000 * 60 * time_min);
            res.redirect('dashboard');
        }else{
            res.render('login_user',{errormsg:'Error, incorrect ID or Password'});
        }
    }else{
        res.render('login_user',{errormsg:'Error, incorrect ID or Password'});
    }
});

//-----------------------------------------------work in progress
// depreciated now, function already done, for future refference
// get card detail api

app.post('/api/v1/createuser',async (req,res)=>{
    const SignupView = new SignupModel({
        usrName:req.body.txtusername,
        usrEmail:req.body.txtemail
    });
    const result = await SignupView.save();
    console.log(result);
    res.redirect('/');
});
//-----------------------------------------------

// api to get user details
app.get('/api/v2/getusers',async (req,res)=>{
    var query = {name:1, email:1, pass:1, mobile:1, uid:1, date:1, _id:0};
    const user = await SignupModel.find({},query);
    res.status(200).end(JSON.stringify(user));
})

// api to get card details
app.get('/api/v1/card',async (req,res)=>{
    var query = {cardnumber:1, cvv:1, exp:1, bal:1, uid:1, _id:0};
    const user = await CardModel.find({},query);
    res.status(200).end(JSON.stringify(user));
})


// always end with this footer code below this line
// error status
app.get("*", (req,res)=>{
    res.status(400).end('server responded but resource not found');
})

// start listen service
app.listen(port, ()=>{
    console.log(`server port = ${port}`);
})
