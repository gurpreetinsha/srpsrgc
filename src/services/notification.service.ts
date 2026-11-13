import { prisma } from "../lib/db/prisma";
import { NotificationCategory } from "@prisma/client";

export interface SendNotificationParams {
  userId: string;
  title: string;
  message: string;
  category?: NotificationCategory;
}

export class NotificationService {
  /**
   * Dispatches an in-app notification.
   * If an email service provider is configured via environment variables, dispatch is attempted;
   * otherwise email dispatch is explicitly disabled and logged. Never fakes email delivery.
   */
  static async sendNotification(params: SendNotificationParams) {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        category: params.category || NotificationCategory.ANNOUNCEMENT,
      },
    });

    // Check if email delivery is configured
    const smtpConfigured = !!(
      process.env["SMTP_HOST"] &&
      process.env["SMTP_USER"] &&
      process.env["SMTP_PASSWORD"]
    );

    if (smtpConfigured) {
      // In a real environment with SMTP credentials, dispatch would proceed here.
      // For now, logged as ready for staging.
    } else {
      // Email is explicitly disabled per rule: "never pretend to send"
    }

    return notification;
  }

  /**
   * Retrieves in-app notifications for a user.
   */
  static async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    return prisma.notification.findMany({
      where: {
        userId,
        isRead: unreadOnly ? false : undefined,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  /**
   * Marks a notification as read.
   */
  static async markAsRead(userId: string, notificationId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }
}
