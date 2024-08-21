#  Funcación Patas Arriba WebApp - Server  

## Introduction

A web app to efficiently manage and coordinate volunteer participation in the foundation's events. 
This repository contains the server-side API. There is a separate project for the client-side SPA.

https://www.fundacionpatasarriba.com/

## Environment Variables

The following environment variables are required for the application to run correctly. Copy the `.env.example` file to `.env` and fill in the required values:

- `ORIGIN`: The frontend origin URL. Example: `http://localhost:5173`
- `TOKEN_SECRET`: A secret string used for token generation.
- `EMAIL`: The email address used for password recovery.
- `EMAIL_PASSWORD`: The password for the above email address.
- `PUSH_SUBJECT`: The subject for VAPID. This should be in the format mailto:your-email@example.com.
- `PUSH_PRIVATE_KEY`: The private key for VAPID.
- `PUSH_PUBLIC_KEY`: The public key for VAPID.

## Creating VAPID Keys

VAPID (Voluntary Application Server Identification for Web Push) keys are used to authenticate push notifications. Follow these steps to create VAPID keys:

1. Generate VAPID keys using the `web-push` library:
    ```sh
    npm run generate-vapid-keys
    ```

    Alternatively, you can generate VAPID keys by visiting [vapidkeys.com](https://vapidkeys.com/).


2. The command will output a public and private key. Copy these keys and add them to your `.env` file:
    ```dotenv
    PUSH_PUBLIC_KEY=your-generated-public-key
    PUSH_PRIVATE_KEY=your-generated-private-key
    PUSH_SUBJECT=mailto:your-email@example.com
    ```

Replace `your-generated-public-key`, `your-generated-private-key`, and `mailto:your-email@example.com` with the actual values generated by the `web-push` command.


## Usage

1. Start the development server:
    ```sh
    npm start
    ```
