import type { NextPage } from 'next'
import Head from 'next/head'
import { useState } from 'react'
import styles from '../styles/Home.module.css'
import Image from 'next/image'

async function fetchApi(endpoint: string) {
  const response = await fetch(`/api/${endpoint}`)
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }

  return response.json()
}

const Home: NextPage = () => {
  const [isLoadingPost, setLoadingPost] = useState(false)
  const [apiResponse, setApiResponse] = useState(null)
  const [apiError, setApiError] = useState(null)

  const getApiCallback = (endpoint: string) => async () => {
    setLoadingPost(true)
    setApiError(null)

    try {
      const response = await fetchApi(endpoint)
      setApiResponse(response)
    } catch (e: any) {
      console.error(e)
      setApiError(e)
    }

    setLoadingPost(false)
  }

  const onGetStatus = getApiCallback('')
  const onSeed = getApiCallback('seed')
  const onGetUsers = getApiCallback('users')
  const onGetPosts = getApiCallback('posts')

  return (
    <div className={styles.container}>
      <Head>
        <title>Prisma example with Vercel</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Prisma Vercel Deployment Example</h1>

        <div className={styles.grid}>
          <button onClick={onGetStatus} className={styles.apiButton}>
            Check API status
          </button>
          <button onClick={onSeed} className={styles.apiButton}>
            Seed data
          </button>
          <button onClick={onGetUsers} className={styles.apiButton}>
            Load users with profiles
          </button>
          <button onClick={onGetPosts} className={styles.apiButton}>
            Load posts
          </button>
          <div
            className={`${styles.loader} ${isLoadingPost ? '' : styles.hidden}`}
          ></div>
        </div>
        <pre
          className={`responseContainer ${styles.code} ${
            apiResponse ? '' : styles.hidden
          }`}
        >
          {apiResponse && JSON.stringify(apiResponse, null, 2)}
        </pre>
      </main>

      <footer className={styles.footer}>
        Powered by
        <img
          src="/vercel.svg"
          alt="Vercel Logo"
          className={styles.logo}
          width={71}
          height={16}
        />
        &
        <Image
          src="/prisma.svg"
          alt="Prisma Logo"
          className={styles.logo}
          width={32}
          height={16}
        />
      </footer>
    </div>
  )
}

export default Home
