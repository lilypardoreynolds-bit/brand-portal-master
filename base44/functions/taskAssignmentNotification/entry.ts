import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event, data } = await req.json();

        // Only send email if task has an assigned_to value
        if (!data?.assigned_to) {
            return Response.json({ success: true, message: 'Task not assigned, no email sent' });
        }

        const assignedToEmail = data.assigned_to;
        
        // Fetch the assigned user to get their full name
        const users = await base44.asServiceRole.entities.User.filter({ email: assignedToEmail });
        const assignedUser = users.length > 0 ? users[0] : null;
        
        if (!assignedUser) {
            console.warn(`Assigned user with email ${assignedToEmail} not found.`);
            return Response.json({ success: true, message: 'User not found' });
        }

        const dueDateFormatted = data.due_date 
            ? new Date(data.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
            : 'Not specified';

        const emailBody = `
Dear ${assignedUser.full_name || assignedUser.email},

You have been assigned a new task: "${data.task_name || 'Untitled Task'}"

Description: ${data.description || 'No description provided'}
Priority: ${data.priority || 'Not specified'}
Due Date: ${dueDateFormatted}

Please log in to your Operations dashboard to view and manage this task.

Best regards,
Operations Task Management
        `.trim();

        await base44.integrations.Core.SendEmail({
            to: assignedToEmail,
            subject: `New Task Assigned: ${data.task_name || 'Untitled Task'}`,
            body: emailBody,
        });

        return Response.json({ success: true, message: 'Notification email sent successfully' });
    } catch (error) {
        console.error('Failed to send task assignment notification:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});