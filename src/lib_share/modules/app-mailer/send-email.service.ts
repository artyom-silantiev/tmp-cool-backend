import { Injectable } from '@nestjs/common';
import { AppMailerService } from './app-mailer.service';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { useEnv } from '@share/lib/env/env';

@Injectable()
export class SendEmailService {
  private env = useEnv();

  constructor(
    private readonly mailer: AppMailerService,
    private readonly i18n: I18nRequestScopeService,
  ) {}

  async sendUserRegistration(params: {
    activationToken: string;
    userEmail: string;
    userPassword: string;
  }) {
    const subject = await this.i18n.t('emails.registration.subject', {
      args: {
        site: this.env.FRONT_MAIN_HOST,
      },
    });
    const activationUrl = `${this.env.FRONT_MAIN_PROTOCOL}://${this.env.FRONT_MAIN_HOST}/activation?code=${params.activationToken}`;

    await this.mailer.sendEmail({
      template: 'registration',
      to: params.userEmail,
      subject: subject,
      context: {
        site: this.env.FRONT_MAIN_HOST,
        email: params.userEmail,
        code: params.userEmail,
        link: activationUrl,
        password: params.userPassword,
        status: 'activation',
      },
    });
  }

  async sendUserPasswordRecovery(params: {
    recoveryToken: string;
    userEmail: string;
  }) {
    const subject = await this.i18n.t('emails.recovery.subject', {
      args: {
        site: this.env.FRONT_MAIN_HOST,
      },
    });
    const recoveryUrl = `${this.env.FRONT_MAIN_PROTOCOL}://${this.env.FRONT_MAIN_HOST}/recovery?code=${params.recoveryToken}`;

    await this.mailer.sendEmail({
      template: 'recovery',
      to: params.userEmail,
      subject: subject,
      context: {
        email: params.userEmail,
        code: params.recoveryToken,
        link: recoveryUrl,
      },
    });
  }

  async sendUserChangeEmail(params: {
    activationToken: string;
    userEmail: string;
  }) {
    const subject = await this.i18n.t('emails.change_email.subject', {
      args: {
        site: this.env.FRONT_MAIN_HOST,
      },
    });
    const activationUrl = `${this.env.FRONT_MAIN_PROTOCOL}://${this.env.FRONT_MAIN_HOST}/activation?code=${params.activationToken}`;

    await this.mailer.sendEmail({
      template: 'change_email',
      to: params.userEmail,
      subject: subject,
      context: {
        email: params.userEmail,
        code: params.activationToken,
        link: activationUrl,
      },
    });
  }

  async sendAdminUserSignUpNotify(data: {
    userEmail: string;
    userPhone: string;
    userTitle: string;
    userSite: string;
  }) {
    const adminEmail = 'admin@localhost';
    if (!adminEmail) {
      return;
    }

    const subject = await this.i18n.t('emails.signup_notify.subject', {
      args: {
        site: this.env.FRONT_MAIN_HOST,
      },
    });

    await this.mailer.sendEmail({
      template: 'signup_notify',
      to: adminEmail,
      subject: subject,
      context: {
        site: this.env.FRONT_MAIN_HOST,
        email: data.userEmail,
        phone: data.userPhone,
        title: data.userTitle,
        userSite: data.userSite,
      },
    });
  }
}
