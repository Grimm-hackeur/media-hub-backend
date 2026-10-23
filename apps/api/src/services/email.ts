import type { Env } from '../config/env.js';

export interface OutgoingEmail { to: string; subject: string; text: string; html: string }
export interface EmailProvider {
  readonly configured: boolean;
  send(mail: OutgoingEmail): Promise<void>;
}

/** Used when RESEND_API_KEY (or EMAIL_FROM) is absent. Sends nothing, and says so. */
export class DisabledEmailProvider implements EmailProvider {
  readonly configured = false;
  constructor(private readonly onSkip: (to: string, subject: string) => void = () => {}) {}
  async send(mail: OutgoingEmail): Promise<void> {
    this.onSkip(mail.to, mail.subject);
  }
}

/** Resend HTTP API (https://resend.com/docs/api-reference/emails/send-email). NOT tested against the live service yet. */
export class ResendEmailProvider implements EmailProvider {
  readonly configured = true;
  constructor(private readonly apiKey: string, private readonly from: string) {}
  async send(mail: OutgoingEmail): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: this.from, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Email provider responded with HTTP ${res.status}`);
  }
}

export function createEmailProvider(env: Env, onSkip?: (to: string, subject: string) => void): EmailProvider {
  const key = env.RESEND_API_KEY ?? env.EMAIL_PROVIDER_API_KEY;
  if (key && env.EMAIL_FROM) return new ResendEmailProvider(key, env.EMAIL_FROM);
  return new DisabledEmailProvider(onSkip);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function verificationEmail(to: string, username: string, link: string): OutgoingEmail {
  return {
    to, subject: 'Confirmez votre adresse e-mail — Media Hub',
    text: `Bonjour ${username},\n\nConfirmez votre adresse e-mail (lien valable 24 h) :\n${link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
    html: `<p>Bonjour ${esc(username)},</p><p>Confirmez votre adresse e-mail (lien valable 24 h) :</p><p><a href="${esc(link)}">Confirmer mon adresse</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`,
  };
}
export function resetEmail(to: string, username: string, link: string): OutgoingEmail {
  return {
    to, subject: 'Réinitialisation du mot de passe — Media Hub',
    text: `Bonjour ${username},\n\nPour choisir un nouveau mot de passe (lien valable 30 min, usage unique) :\n${link}\n\nSi vous n'avez rien demandé, ignorez ce message : votre mot de passe reste inchangé.`,
    html: `<p>Bonjour ${esc(username)},</p><p>Pour choisir un nouveau mot de passe (lien valable 30 min, usage unique) :</p><p><a href="${esc(link)}">Réinitialiser mon mot de passe</a></p><p>Si vous n'avez rien demandé, ignorez ce message : votre mot de passe reste inchangé.</p>`,
  };
}
export function passwordChangedEmail(to: string, username: string): OutgoingEmail {
  return {
    to, subject: 'Votre mot de passe a été modifié — Media Hub',
    text: `Bonjour ${username},\n\nLe mot de passe de votre compte vient d'être modifié et toutes vos sessions ont été fermées. Si ce n'est pas vous, contactez le support immédiatement.`,
    html: `<p>Bonjour ${esc(username)},</p><p>Le mot de passe de votre compte vient d'être modifié et toutes vos sessions ont été fermées. Si ce n'est pas vous, contactez le support immédiatement.</p>`,
  };
}

export function otpEmail(to: string, username: string, code: string): OutgoingEmail {
  return {
    to, subject: `${code} est votre code de vérification — Media Hub`,
    text: `Bonjour ${username},\n\nVotre code de vérification Media Hub : ${code}\n\nIl est valable 10 minutes. Ne le communiquez à personne : nous ne vous le demanderons jamais.\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
    html: `<p>Bonjour ${esc(username)},</p><p>Votre code de vérification Media Hub :</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${esc(code)}</p><p>Il est valable 10 minutes. Ne le communiquez à personne : nous ne vous le demanderons jamais.</p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`,
  };
}
export function accountExistsEmail(to: string, link: string): OutgoingEmail {
  return {
    to, subject: 'Tentative de création de compte — Media Hub',
    text: `Quelqu'un a essayé de créer un compte Media Hub avec cette adresse, qui en possède déjà un.\nSi c'est vous, connectez-vous ou réinitialisez votre mot de passe : ${link}\nSinon, ignorez ce message.`,
    html: `<p>Quelqu'un a essayé de créer un compte Media Hub avec cette adresse, qui en possède déjà un.</p><p>Si c'est vous : <a href="${esc(link)}">se connecter ou réinitialiser le mot de passe</a>.</p><p>Sinon, ignorez ce message.</p>`,
  };
}
