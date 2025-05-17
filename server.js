const startApp = require('./app');
const port = 3000;

startApp((app) => {
    app.listen(port, () => {
        console.log(`Server đang chạy tại http://localhost:${port}`);
    });
});
