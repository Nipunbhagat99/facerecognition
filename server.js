const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const bodyParser = require('body-parser');
const cors = require('cors');
const Clarifai = require('clarifai');
const  knex = require('knex')({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'nipun123',
      database : 'smartbrain'
    }
  }); 


const app = express();


const spp = new Clarifai.App({
    apiKey: '398f27bb2d634ccb92352160c129a62d'
   });

   

app.use(bodyParser.json());
app.use(cors());

app.get('/',(req,res) => {
    res.send(database.users);
})



app.post('/imageurl',(req,res) => {
    spp.models.predict(Clarifai.FACE_DETECT_MODEL, req.body.input)
    .then(data => {
        res.json(data);
    })
    .catch(err => res.status(400).json('unable to work with API'));
})



app.get('/profile/:id',(req,res)=>{
    const {id} = req.params;
    let found = false;
    knex.select('*').from('users').where({id})
    .then(user => {
        if(user.length){
        res.json(user[0])}
        else {
            res.status(400).json('error getting user')
        }
    })
})
 
app.post('/signin',(req,res)=>{
    const { email,password} = req.body
    if(!email || !password){
        return res.status(400).json('incorrect form submission'); 
    }
    knex.select('email','hash').from('login')
    .where('email','=',email)
    .then(data =>{
        const isValid = bcrypt.compareSync(password, data[0].hash);
        if(isValid){
          return knex.select('*').from('users')
           .where('email','=',email)
           .then(user => {
               res.json(user[0])
           })
           .catch(err => res.status(400).json('unable to get user'))
        }else{
            res.status(400).json('wrong credentials')
        }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})


app.post('/register',(req,res)=>{
    const {email ,name, password} = req.body;
    if(!email || !name|| !password){
        return res.status(400).json('incorrect form submission'); 
    }
    const hash =bcrypt.hashSync(password );
    knex.transaction(trx => {
        trx.insert({
            hash : hash ,
            email : email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users').returning('*').insert({
                email:loginEmail[0],
                name : name,
                joined : new Date()
            }).then(user => {
                res.json(user[0]);
            })
        }).then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register'));
    
})

app.put('/image',(req,res)=> {
    const {id} = req.body;
    let found = false;
    knex('users').where('id','=',id)
    .increment('entries',1)
    .returning('entries')
    .then(entries =>{
        res.json(entries[0]);
    }).catch(err => res.status(400).json('unable to get entries'))
        
})

app.listen(process.env.PORT || 3000,()=>{
    console.log(`app is running on port ${process.env.PORT}`);
});