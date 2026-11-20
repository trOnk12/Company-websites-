# Personal voice lecturer

On a lesson page, open **Discuss this lesson in Voice**. Guided practice reads the published questions and answers. On a browser offering speech input and output, choose **Start hands-free**, keep the page visible and answer aloud. Say **next**, **repeat**, **explain** or **stop**. The guide reads the reference answer after your attempt so you can compare. It does not grade a free-form answer. A browser may pause at silence, permission loss, screen lock or a switch to another app.

For open questions on a phone, **Copy lesson for Voice** prepares the lesson and its source list for a conversation in ChatGPT. Paste and send the text, then start Voice in that chat. The conversation can continue in the language you prefer.

Two optional modes support open questions on the lesson page itself:

- **Installed browser model.** On compatible browsers with an available LanguageModel, enable the on-device lecturer. The feature uses the installed model to select a passage and a follow-up question. The course does not request a model download.
- **Private OpenAI-backed server.** Run the following on your own computer with Node 22 or later. Set OPENAI_API_KEY using your local secret manager or an interactive shell prompt. The optional OPENAI_MODEL variable selects a Responses API model supporting structured outputs. The default is gpt-4.1-mini. Provider requests incur charges on that API account.

```sh
node labs/voice-tutor/server.js
```

Open the local URL printed by the server, choose a lesson and enter its temporary session code in **Discuss this lesson in Voice**. Type a question or use voice input. In hands-free mode, commands control playback and other utterances go to the lecturer. The server binds to loopback, generates a fresh session code at startup and permits one outstanding call and 80 provider calls per run. The key stays in the server environment. Use the printed local URL on the same computer. Phone access to this private server requires a separately configured authenticated HTTPS route; the public site provides guided practice and the ChatGPT Voice handoff.

## Evidence and behavior

The model selects indices into course passages and quiz items. The app validates the indices and displays the selected course text with its section link. Missing or invalid selections return an evidence-gap message. The provider receives the current question, the previous turn and excerpts from the current lesson. The self-hosted service reads the course from its own files and requests no response storage. A valid selection can still be irrelevant. Inspect the section and its references when the match seems wrong.

Run the deterministic selection tests from the repository root:

```sh
node --test labs/voice-tutor/server.test.js
```
