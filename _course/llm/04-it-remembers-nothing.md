---
title: It remembers nothing
short: Stateless, and the context window
summary: Your chatbot answers the first question well, then forgets it on the second. Or it remembers everything, and each message gets slower and more expensive. Both come from one fact about the API. Here's what your app must send, every time.
takeaway: The model API is stateless: it remembers nothing between requests, so the app sends the whole conversation every time. Everything sent, plus the answer, must fit in the context window, the model's working memory for that request. Long chats cost more per message and can degrade, so trim, summarise or drop old turns on purpose.
---

## The problem

Your first version sends only the user's latest message. The bot answers "What's its battery life?" with "What device do you mean?", though the user named it one message earlier. Your fix sends the whole chat each time, and after fifty messages each reply is slower and costs ten times more. What's going on?

## See it

```diagram context
```

## The building block

The model API is **stateless**: each request starts from nothing. There's no session, no memory kept on the server between your requests, holding your conversation. If the model is to "remember" an earlier message, that message must be in this request.

So a chat app keeps the conversation itself, in its ViewModel or database, and sends all of it with every new message: earlier user messages, earlier answers, then the new message.

Everything in one request, plus the answer the model writes, must fit in the **context window**: the model's working memory for that request, measured in tokens. Windows are large now, but three things grow with every message:

- **Cost:** you pay for all the input tokens again, every turn, so a chat's total cost grows faster than its length. Prompt caching makes a repeated beginning cheaper and faster to read, but you still send it.
- **Time:** more input to read before the first token (puzzle 3).
- **Quality:** Anthropic notes that as the token count grows, accuracy and recall degrade.

So long chats need a policy: keep the last few turns, replace old ones with a short summary, or drop what doesn't matter. That's your code's decision, not the model's.

## The analogy

A brilliant consultant with no memory at all. Every time you call, you read them the whole file so far, then ask your question. A thicker file takes longer to read, costs more of their time, and eventually they skim.

## Check yourself

- Your app sends only the latest message. Why does the bot forget the device the user just named?::*The API keeps nothing between requests, so the earlier message wasn't sent||The model's context window was full after one message >> One message is tiny; the earlier one wasn't in the request. >> s2||The model forgets on purpose to protect privacy >> It keeps nothing because the API is stateless, not by choice per message. >> s2::Stateless: send what it should know.
- The chat reaches fifty messages. Why does each reply cost more?::*All earlier messages are sent and paid for again with every new one||The model charges more for later messages in a chat >> The price per token is the same; there are just more tokens per request. >> s3||Answers get longer as the chat goes on >> Possibly, but the cost is mostly the growing input. >> s3::The whole history, every time.
- What's the difference between the context window and the conversation your app stores?::*The context window is what one request holds, while the stored conversation is all of it||The context window is all of the conversation, while the stored one is what one request holds >> That's the two swapped. >> the-building-block::One request's view vs the full record.

## Sources

- [Anthropic: Working with the Messages API](https://docs.anthropic.com/en/docs/build-with-claude/working-with-messages) ("The Messages API is stateless, which means that you always send the full conversational history to the API.")
- [Anthropic: Context windows](https://docs.anthropic.com/en/docs/build-with-claude/context-windows) (the context window is "a 'working memory' for the model"; "As token count grows, accuracy and recall degrade, a phenomenon known as context rot")
