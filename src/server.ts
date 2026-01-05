import { app } from "./app"

let port = 3001
app.listen(port, () => {
    console.log(`server running on port ${port}`)
})