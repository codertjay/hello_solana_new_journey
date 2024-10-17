import {
    Keypair,
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    TransactionInstruction,
    Transaction, sendAndConfirmTransaction
} from "@solana/web3.js";

import fs from 'mz/fs';

import * as path from "path";

/*
*  Our Key pair used to create the on-chain rust program
* */


const PROGRAM_KEYPAIR_PATH = path.join(
    path.resolve(__dirname, '../../dist/program'),
    'program-keypair.json'
)

async function main() {
    console.log("Launching client... ");

    /*
    * Connect to solana Dev net
    * */

    let connection = new Connection('http://localhost:8899', 'confirmed')


    /*
    * Get our program's public key
    * */
    // @ts-ignore
    const secretKeyString = await fs.readFile(PROGRAM_KEYPAIR_PATH, {encoding: 'utf8'});
    // @ts-ignore
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const programKeyPair = Keypair.fromSecretKey(secretKey);
    let programId: PublicKey = programKeyPair.publicKey;

    /*
    * Generate an account (Keypair) to transact with our program */
    const triggerKeyPair = Keypair.generate();
    const airdropRequest = await connection.requestAirdrop(
        triggerKeyPair.publicKey,
        LAMPORTS_PER_SOL,
    )
    await connection.confirmTransaction(airdropRequest);

    /*
    * conduct a transaction with our program
    * */

    console.log("--pinging program ", programId.toBase58());
    const instruction = new TransactionInstruction({
        keys: [{pubkey: triggerKeyPair.publicKey, isSigner: false, isWritable: true}],
        programId,
        data: Buffer.alloc(0)
    })

    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [triggerKeyPair]
    )

}


main().then(
    () => process.exit(),
    err => {
        console.error(err);
        process.exit(-1);
    }
)


