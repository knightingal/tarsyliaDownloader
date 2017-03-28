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

(async () => {
    books = await queryBook();
    for (let book of books) {
        let sectionDetails = await querySection(book.id);
        book.section = sectionDetails;
        for (let section of sectionDetails) {
            let imgDetails = await queryImg(section.id);
            section.img = imgDetails;
        }
    }
    return books;
})()
.then(books => {
    console.log(JSON.stringify(books));
    connection.end();
});