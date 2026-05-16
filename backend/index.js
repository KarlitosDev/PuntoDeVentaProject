require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/db/connection');

const PORT = process.env.PORT || 3000;

const start = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });
};

start();