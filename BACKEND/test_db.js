const mongoose = require('mongoose');

const uri = 'mongodb://luli2006gomez_db_user:Inova2026@ac-uufjwma-shard-00-00.emf4psw.mongodb.net:27017,ac-uufjwma-shard-00-01.emf4psw.mongodb.net:27017,ac-uufjwma-shard-00-02.emf4psw.mongodb.net:27017/inova?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri)
  .then(() => {
    console.log("Connected successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Connection failed", err);
    process.exit(1);
  });
