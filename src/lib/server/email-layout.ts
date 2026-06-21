import type { Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';

/** Brand tokens aligned with src/app.css (light theme) — inline for email client compatibility. */
export const EMAIL = {
	bg: '#f7f5f0',
	surface: '#ffffff',
	surfaceMuted: '#eef2eb',
	border: '#dde5d8',
	text: '#1f2a24',
	textMuted: '#5c6b62',
	primary: '#2c4a3e',
	primaryHover: '#243d32',
	accent: '#d4a853'
} as const;

export function escapeEmailHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function brandedHeaderHtml(): string {
	return `<tr>
            <td style="background-color:${EMAIL.primary};padding:28px 32px 24px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 12px;">
                <tr>
                  <td style="width:44px;height:44px;background-color:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.35);border-radius:12px;text-align:center;vertical-align:middle;font-size:20px;font-weight:700;color:#ffffff;line-height:44px;">S</td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Skaffu</p>
            </td>
          </tr>`;
}

function signOffHtml(locale: Locale): string {
	const signOff = translate(locale, 'email.templates.common.signOff');
	return `<tr>
            <td style="padding:20px 32px 28px;background-color:${EMAIL.surfaceMuted};border-top:1px solid ${EMAIL.border};">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${EMAIL.textMuted};text-align:center;">
                ${escapeEmailHtml(signOff)}<br />
                <strong style="color:${EMAIL.text};font-weight:600;">Skaffu</strong>
              </p>
            </td>
          </tr>`;
}

export interface BrandedEmailCta {
	label: string;
	href: string;
}

export interface BuildBrandedEmailHtmlOptions {
	locale: Locale;
	preheader: string;
	title: string;
	bodyHtml: string;
	cta?: BrandedEmailCta;
	/** Extra footer block above sign-off (link help, opt-out note, etc.). */
	footerHtml?: string;
	includeSignOff?: boolean;
}

export function buildBrandedEmailHtml(options: BuildBrandedEmailHtmlOptions): string {
	const {
		locale,
		preheader,
		title,
		bodyHtml,
		cta,
		footerHtml,
		includeSignOff = true
	} = options;
	const safeTitle = escapeEmailHtml(title);
	const safePreheader = escapeEmailHtml(preheader);

	const ctaBlock = cta
		? `<tr>
            <td align="center" style="padding:0 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius:10px;background-color:${EMAIL.primary};">
                    <a href="${escapeEmailHtml(cta.href)}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;background-color:${EMAIL.primary};border:1px solid ${EMAIL.primaryHover};">${escapeEmailHtml(cta.label)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
		: '';

	const footerBlock = footerHtml
		? `<tr>
            <td style="padding:0 32px 32px;border-top:1px solid ${EMAIL.border};">
              ${footerHtml}
            </td>
          </tr>`
		: '';

	const signOffBlock = includeSignOff ? signOffHtml(locale) : '';

	return `<!DOCTYPE html>
<html lang="${locale}" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${safeTitle}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${EMAIL.bg};font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${safePreheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${EMAIL.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:${EMAIL.surface};border:1px solid ${EMAIL.border};border-radius:16px;overflow:hidden;">
          ${brandedHeaderHtml()}
          <tr>
            <td style="padding:32px 32px 8px;">
              ${bodyHtml}
            </td>
          </tr>
          ${ctaBlock}
          ${footerBlock}
          ${signOffBlock}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Lightweight branded shell for owner digests and alerts (table / list content). */
export function buildOwnerEmailShellHtml(options: {
	title: string;
	subtitle?: string;
	bodyHtml: string;
	footerHtml?: string;
}): string {
	const safeTitle = escapeEmailHtml(options.title);
	const subtitleBlock = options.subtitle
		? `<p style="margin:0;opacity:0.9;font-size:14px;">${escapeEmailHtml(options.subtitle)}</p>`
		: '';
	const footerBlock = options.footerHtml
		? `<div style="padding:16px 28px 24px;font-size:12px;color:${EMAIL.textMuted};border-top:1px solid ${EMAIL.border};">${options.footerHtml}</div>`
		: '';

	return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: ${EMAIL.text}; background: ${EMAIL.bg}; margin: 0; padding: 24px 16px; }
    .card { max-width: 640px; margin: 0 auto; background: ${EMAIL.surface}; border: 1px solid ${EMAIL.border}; border-radius: 16px; overflow: hidden; }
    .header { background: ${EMAIL.primary}; color: #fff; padding: 24px 28px; }
    .header h1 { margin: 0 0 8px; font-size: 22px; }
    .body { padding: 28px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;opacity:0.85;">Skaffu</p>
      <h1>${safeTitle}</h1>
      ${subtitleBlock}
    </div>
    <div class="body">
      ${options.bodyHtml}
    </div>
    ${footerBlock}
  </div>
</body>
</html>`;
}
