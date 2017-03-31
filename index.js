const mysql = require('mysql');
// const fetch = require('node-fetch');
const fs = require('fs');
const ImgArrayManager = require('./download').ImgArrayManager;

const connection = mysql.createConnection({
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

function batchFetchImgs(imgs) {
    return Promise.all(imgs.map(img => {
        return fetch(img.src).then(res => {
            var dest = fs.createWriteStream('./' + img.id + '.jpg');
            res.body.pipe(dest);
            console.log(img.src + "download succ");
        });
    }));
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
})().then(async books => {
    // console.log(JSON.stringify(books));
    connection.end();

    new ImgArrayManager(books[0].section[0].img).batchDownload().then(() => {
        console.log("completed");  
    });
});