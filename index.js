
// importing modules
const express = require('express');
const path = require('path');
const {check, validationResult} = require('express-validator');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/costumes',{
    useNewUrlParser: true,
    useUnifiedTopology:true
});

// set up the model
const Order = mongoose.model('Order',{
    name : String,
    phone : String,
    email : String,
    address : String,
    city : String,
    province : String,
    quantitykids : Number,
    quantityadult : Number,
    quantityseniors : Number,
    salesTax : Number,
    total : Number
});
// set up the app
var myApp = express();
myApp.use(express.urlencoded({extended:false}));

// set paths to public and view folder
myApp.set('view engine','ejs');
myApp.set('views',path.join(__dirname,'views'));
myApp.use(express.static(__dirname + '/public'));


myApp.get('/',function(req,res){
    res.render('form');
});

myApp.get('/allOrders', function(req,res){
    Order.find({}).exec(function(err, orders){
        res.render('allOrders',{orders:orders});
    });
});

function itemCheck(value,{req}){
    if(parseInt(req.body.kids) + parseInt(req.body.adult) + parseInt(req.body.seniors)  > 0){
        return true;
    }
    else{
        throw new Error('You have to buy atleast one Item');
    }
}

myApp.post('/', [
    check('kids', 'Enter valid kids costume value').isInt({min:0}),
    check('adult', 'Enter valid adult costume value').isInt({min:0}),
    check('seniors', 'Enter valid senior costume value').isInt({min:0}),
    check('name', 'Enter Name').trim().notEmpty(),
    check('phone','Phone number not in correct format').trim().matches(/^[0-9]{10}$/).optional({checkFalsy: true}),
    check('email').trim().isEmail().withMessage('Email not in correct format').optional({checkFalsy: true}),
    check('address', 'Enter Address').trim().notEmpty(),
    check('city', 'Enter City').trim().notEmpty(),
    check('province', 'Select Province').notEmpty(),
    check('kids','adult','seniors').custom(itemCheck)
], function(req,res){
    const errors = validationResult(req);
    if(parseInt(req.body.kids) + parseInt(req.body.adult) + parseInt(req.body.seniors) <= 0){
        errors.array().push("Buy atleast one item!!!!");
    }
    if(errors.isEmpty()){

        var quantitykids = req.body.kids;
        var quantityadult = req.body.adult;
        var quantityseniors = req.body.seniors;

        var name = req.body.name;
        var phone = req.body.phone;
        var email = req.body.email;
        var address = req.body.address;
        var city = req.body.city;
        var province = req.body.province;

        // sales tax according to provinces/territory
        const tYukon = .05;
        const tNWT = .05;
        const tNunavut = .05;
        const pAlberta = .05;
        const pSaskat = .11;
        const pBC = .12;
        const pManitoba = .12;
        const pOntario = .13;
        const pQuebec = .149;
        const pBrunswick = .15;
        const pScotia = .15;
        const pEdward = .15;
        const pNewfy = .15;

        // cost of each costume
        const costKids = 100;
        const costAdults = 300;
        const costSeniors = 500;

        var subTotal = (parseInt(quantitykids) * costKids) + (parseInt(quantityadult) * costAdults) + (parseInt(quantityseniors) * costSeniors);

        var salesTax = 0;
        var total = 0;

        if(province == 'Alberta' || province == 'NorthwestTerritories' || province == 'Yukon' || province == 'Nunavut'){
            salesTax = 5;
            total = subTotal + (.05) * subTotal;
        }
        else if(province == 'NewBrunswick' || province == 'NovaScotia' || province == 'PrinceEdwardIsland' || province == 'NewfoundlandandLabrador'){
            salesTax = 15;
            total = subTotal + (.15) * subTotal;
        }
        else if(province == 'BritishColumbia' || province == 'Manitoba'){
            salesTax = 12;
            total = subTotal + (.12) * subTotal;
        }
        else if(province == 'Saskatchewan'){
            salesTax = 11;
            total = subTotal + (.11) * subTotal;
        }
        else if(province == 'Ontario'){
            salesTax = 13;
            total = subTotal + (.13) * subTotal;
        }
        else if(province == 'Quebec'){
            salesTax = 14.9;
            total = subTotal + (.149) * subTotal;
        }

            var data = {
            name : name,
            phone : phone,
            email : email,
            address : address,
            city : city,
            province : province,
            quantitykids : quantitykids,
            quantityadult : quantityadult,
            quantityseniors : quantityseniors,
            salesTax : salesTax,
            total : total
            }

        var myOrder = new Order(data);
        myOrder.save();
        res.render('form',data);
    }
    else{
        console.log(errors.array());
        res.render('form',{
            errors:errors.array(),
            userData: req.body
        });
    }
})

// start the server (listen at a port)
myApp.listen(8080);
console.log("Everything executed, Open http://localhost:8080/ in the browser");