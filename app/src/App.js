import { useCallback, useEffect, useState } from 'react';

const MessageList = () => {
  const [messages, setMessages] = useState([])
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("http://localhost:8080/messages")
      const json = await res.json()
      setMessages(json)
    }, 100)
    return () => {
      clearInterval(interval)
    }
  }, [])
  return (
    <div>
      { messages.map(m => (<div>
        {m.input}
      </div>)) }
    </div>
  )
}

const Form = () => {
  const [input, setInput] = useState("")
  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    fetch("http://localhost:8080/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({input})
    })
  }, [input]) 
  const handleChange = useCallback((e) => {
    setInput(e.target.value)
  }, [])
  return (
    <form onSubmit={handleSubmit}>
      <input type="text" onChange={handleChange} value={input}></input>
      <button type='submit'>Submit</button>
    </form>
  )
}

function App() {
  return (
    <div>
      <MessageList/>
      <Form/>
    </div>
  );
}

export default App;
