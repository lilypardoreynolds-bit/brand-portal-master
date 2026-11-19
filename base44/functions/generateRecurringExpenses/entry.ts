import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled (no user) or admin user calls
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (isAuthenticated) {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dateStr = `${currentMonth}-01`;

    // Get all recurring template expenses (not generated copies)
    const templates = await base44.asServiceRole.entities.Expense.filter({ is_recurring: true });
    // Filter out generated copies (they have recurrence_source_id set)
    const recurringTemplates = templates.filter(e => !e.recurrence_source_id);

    let created = 0;
    let skipped = 0;

    for (const template of recurringTemplates) {
      // For annual, only generate in January
      if (template.recurrence_frequency === 'Annual') {
        if (now.getMonth() !== 0) { skipped++; continue; }
      }

      // Check if already generated this month
      const existing = await base44.asServiceRole.entities.Expense.filter({
        recurrence_source_id: template.id,
        recurrence_month: currentMonth,
      });

      if (existing.length > 0) { skipped++; continue; }

      await base44.asServiceRole.entities.Expense.create({
        date: dateStr,
        expense_name: template.expense_name,
        category: template.category,
        vendor: template.vendor || '',
        amount: template.amount,
        expense_type: template.expense_type,
        payment_status: 'Pending',
        notes: `Auto-generated recurring expense (${template.recurrence_frequency})`,
        attachment_url: '',
        is_recurring: false,
        recurrence_source_id: template.id,
        recurrence_month: currentMonth,
      });
      created++;
    }

    return Response.json({ success: true, created, skipped, month: currentMonth });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});