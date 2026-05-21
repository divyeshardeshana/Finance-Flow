export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function hasNotificationPermission(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

export function showNotification(options: NotificationOptions): void {
  if (!hasNotificationPermission()) {
    console.warn('Notification permission not granted');
    return;
  }

  const notification = new Notification(options.title, {
    body: options.body,
    icon: options.icon || '/icon-192x192.png',
    tag: options.tag,
    data: options.data,
    requireInteraction: false,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

export interface BillReminder {
  id: string;
  bill_name: string;
  amount: number;
  next_due_date: string;
  reminder_days_before: number;
}

export function checkDueBills(bills: BillReminder[]): BillReminder[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueSoonBills = bills.filter((bill) => {
    const dueDate = new Date(bill.next_due_date);
    dueDate.setHours(0, 0, 0, 0);

    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysUntilDue <= bill.reminder_days_before && daysUntilDue >= 0;
  });

  return dueSoonBills;
}

export function notifyDueBills(bills: BillReminder[]): void {
  bills.forEach((bill) => {
    const dueDate = new Date(bill.next_due_date);
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - new Date().setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24)
    );

    const message =
      daysUntilDue === 0
        ? `${bill.bill_name} is due today!`
        : `${bill.bill_name} is due in ${daysUntilDue} day${
            daysUntilDue > 1 ? 's' : ''
          }`;

    showNotification({
      title: 'Bill Reminder',
      body: `${message} - Amount: $${bill.amount.toFixed(2)}`,
      tag: `bill-${bill.id}`,
      data: { billId: bill.id },
    });
  });
}
