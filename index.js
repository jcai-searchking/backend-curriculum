
const express = require('express')
const app = express()

app.use(express.json())

let users = []
let nextId = 1



app.use((req, res, next)=> {
    console.log("Incoming:", req.method, req.url);
    next();
})

app.post('/users', (req, res) => {
    const { name, age } = req.body

    if (!name || !age) {
        return res.status(400).json({ error: "name and age required"})
    }

    const newUser = {
        id: nextId++,
        name,
        age
    }

    users.push(newUser);

    res.status(201).json({ 
        message: "User created successfully",
        user: newUser
    })
})

app.get('/users', (req, res) => {
    res.json({users})
})

app.get('/users/:id', (req, res) => {
    const id = Number(req.params.id)
    const user = users.find(user => user.id === id)

    if (!user) {
        return res.status(404).json({ error: "User not found."})
    }

    res.json(user)
})


app.put('/users/:id' , (req, res) => {
    const id = Number(req.params.id)
    const user = users.find(user=> user.id === id)

    if (!user) {
        return res.status(404).json({ error: "User not found."})
    }

    const { name, age } = req.body

    if (name !== undefined) user.name = name
    if (age !== undefined ) user.age = age

    res.json({
        
        message: 'User updated successfully',
        user

    })
})



app.delete('/users/:id', (req, res)=> {
    const id = Number(req.params.id)
    const index = users.findIndex( u => u.id === id )

    if (index === -1) {
        return res.status(404).json({ error: "User Not Found"})
    }

    users.splice(index, 1)

    res.json({ nessage: "User deleted sucessfully"})

})






app.use((req, res)=> {
    res.status(404).json({ error: "Not Found"})
})

app.listen(3001, ()=> {
    console.log("Server running on port http://localhost:3000")
})