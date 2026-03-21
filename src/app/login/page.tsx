'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { AuthResponse, UserResponse } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase'
import styles from './page.module.css'

type AuthMode = 'login' | 'signup'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [mode, setMode] = useState<AuthMode>('login')
    const [displayName, setDisplayName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const supabase = getSupabaseClient()
        supabase.auth.getUser().then((result: UserResponse) => {
            if (result.data.user) {
                router.replace(searchParams.get('next') || '/dashboard')
            }
        })
    }, [router, searchParams])

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setMessage(null)
        setIsSubmitting(true)

        try {
            const supabase = getSupabaseClient()

            if (mode === 'signup') {
                const signUpResult: AuthResponse = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            display_name: displayName.trim(),
                        },
                    },
                })

                if (signUpResult.error) {
                    throw signUpResult.error
                }

                if (signUpResult.data.session) {
                    router.replace(searchParams.get('next') || '/dashboard')
                    router.refresh()
                    return
                }

                setMessage('Conta criada. Confirme seu email antes de entrar.')
                setMode('login')
                return
            }

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                if (signInError.message.toLowerCase().includes('email not confirmed')) {
                    throw new Error('Conta criada, mas o email ainda nao foi confirmado no Supabase.')
                }
                throw signInError
            }

            router.replace(searchParams.get('next') || '/dashboard')
            router.refresh()
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Falha ao autenticar.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className={styles.page}>
            <section className={styles.panel}>
                <div className={styles.copy}>
                    <span className={styles.eyebrow}>Supabase Auth</span>
                    <h1>{mode === 'login' ? 'Entrar na sua casa conectada' : 'Criar sua conta'}</h1>
                    <p>
                        A partir de agora, cameras e demais recursos passam a ficar ligados ao usuario autenticado
                        no Supabase, nao a um UUID salvo no navegador.
                    </p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.modeSwitch}>
                        <button
                            className={mode === 'login' ? styles.modeActive : styles.modeButton}
                            onClick={() => setMode('login')}
                            type="button"
                        >
                            Login
                        </button>
                        <button
                            className={mode === 'signup' ? styles.modeActive : styles.modeButton}
                            onClick={() => setMode('signup')}
                            type="button"
                        >
                            Cadastro
                        </button>
                    </div>

                    {mode === 'signup' && (
                        <label className={styles.field}>
                            <span>Nome</span>
                            <input
                                className={styles.input}
                                value={displayName}
                                onChange={(event) => setDisplayName(event.target.value)}
                                placeholder="Seu nome"
                                type="text"
                            />
                        </label>
                    )}

                    <label className={styles.field}>
                        <span>Email</span>
                        <input
                            className={styles.input}
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="voce@exemplo.com"
                            required
                            type="email"
                        />
                    </label>

                    <label className={styles.field}>
                        <span>Senha</span>
                        <input
                            className={styles.input}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            minLength={6}
                            required
                            type="password"
                        />
                    </label>

                    {error && <p className={styles.error}>{error}</p>}
                    {message && <p className={styles.message}>{message}</p>}

                    <button className={styles.submit} disabled={isSubmitting} type="submit">
                        {isSubmitting ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar conta e entrar'}
                    </button>
                </form>
            </section>
        </main>
    )
}
