const fast_csv = require('fast-csv'),
  fs = require('fs'),
  mongodb = require('mongodb');

class CSV_parser {
  constructor(path_to_csv) {
    this.path = path_to_csv;
  }
  
  // Streams the CSV file and parses it asynchronously.
  parse() {
    return new Promise((res, rej) => {
      let rows = [];
      fs.createReadStream(this.path)
        .pipe(
          fast_csv({
            // This may look strange, but it has a purpose. 
            // There are ~89 columns in the CSV, and we only care about a few of them.
            // So, this is a sparse array containing the ones we want, and empty space
            // for every one we don't want.
            headers: [
              , , , , , ,
              "FirstName",
              "LastName", , , , , , , , , , , ,
              "Email",
              "CellPhone", , , , , , , , , , , , ,
              "ROLE",
              "BACKUP ROLE", , , , , , , , , ,
              'Room', , , , , , , , , ,
              "TRAINING DATE(s)", , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,
            ],
            // Replace the first line of the CSV file (the header line) with our sparse array.
            renameHeaders: true
          })
          .on('data', (row) => {
            let newRow = {
              name: row['FirstName'] + ' ' + row['LastName'],
              email: row['Email'],
              cell: row['CellPhone'],
              assignment: row['ROLE'],
              location: row['Room']
            };
            rows.push(newRow);
          })
          .on('end', () => {
            res(rows);
          })
        );
    });
  }
  
  insert(data){
    let uri = '';
    if (process.argv[2] == '--local' || process.argv[2] == '-l') {
        uri = 'mongodb://localhost:27017/pmd';
        console.log('Database set to local.');
    } else if (process.argv[2] == '--prod' || process.argv[2] == '-p') {
        uri = process.env.MONGODB_URI;
        console.log('Database set to production.');
    } else {
        console.log('Defaulted database to local. Use option --prod if production needed.');
        uri = 'mongodb://localhost:27017/pmd';
    }
    
    mongodb.MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
        // find the largest id by sorting by id and grabbing the top row
        db.collection('volunteers').find().sort({id: -1}).limit(1).toArray((err, items) => {
          // if there are no rows, we'll start with id = 1
          let maxId = 0;
          if(items.length > 0){
            maxId = items[0]['id'];
          }
          // assign each row to an incrementing id
          for (let row=0; row<data.length; row++) {
            maxId += 1;
            data[row]['id'] = maxId;
          }
          // insert all our data
          for (let row=0; row<data.length; row++) {
            // do a "upsert" insert or update on cell number
            db.collection('volunteers').update({
              'cell': data[row]['cell']
            }, data[row], {upsert: true});
          }
          
          db.close();
        });
    });
  }
}

module.exports = CSV_parser;