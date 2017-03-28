var mysql = require('mysql');

var connection = mysql.createConnection({
    host:'127.0.0.1',
    user:'Knightingal',
    password:'123456',
    database:'djangodb'
});

connection.connect()


function queryBook() {
    return new Promise((resolve, reject) => {
        connection.query('select * from tarsylia_book', (err, rows, fields) => {
            if (err) throw err;
            resolve(rows);
        });
    });
}


function querySection(book_id) {
    return new Promise((resolve, reject) => {
        connection.query('select * from tarsylia_section where book_id = ' + book_id, (err, rows, fields) => {
            if (err) throw err;
            resolve(rows);
        });
    });
}


function queryImg(section_id) {
    return new Promise((resolve, reject) => {
        connection.query('select * from tarsylia_img where section_id = ' + section_id, (err, rows, fields) => {
            if (err) throw err;
            resolve(rows);
        });
    });
}



queryBook().then(bookRows => {
    return Promise.all(bookRows.map(bookRow => {
        return querySection(bookRow.id).then(sectionRows => {
            bookRow.section = sectionRows;
        });
    })).then(() => {
        return bookRows;
    });
}).then(bookRows => {
    // console.log(bookRows);
    return Promise.all(bookRows.map(bookRow => {
        return Promise.all(bookRow.section.map(section => {
            return queryImg(section.id).then(imgRows => {
                section.img = imgRows;
            });
        })).then(() => {});
    })).then(() => {
        return bookRows;
    });
}).then(bookRows => {
    console.log(JSON.stringify(bookRows));
    connection.end();
});