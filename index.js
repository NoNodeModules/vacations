const express = require('express');



const app = express();



const cors = require('cors')
const cookieParser = require('cookie-parser')

require('./dbconfig')

app.use(express.json())
app.use(cors())
app.use(cookieParser())

app.use('/auth', require('./routes/auth'))
app.use('/vacations', require('./routes/vacations'))

app.get('/', (req, res) => {
    res.send('Welcome to my travel agency, its coming soon just wait.')
})



app.listen(1110, () => console.log("1110 OK"))