import {
    Package,
    Users,
    MessageSquare,
    TrendingUp,
    ArrowUp,
    ArrowDown,
    Clock,
    AlertTriangle
} from 'lucide-react';

export default function AdminDashboardPage() {
    const stats = [
        {
            name: 'Active Products',
            value: '3',
            change: '+1',
            trend: 'up',
            icon: Package
        },
        {
            name: 'Total Users',
            value: '1,247',
            change: '+12%',
            trend: 'up',
            icon: Users
        },
        {
            name: 'Queries Today',
            value: '3,456',
            change: '+23%',
            trend: 'up',
            icon: MessageSquare
        },
        {
            name: 'Monthly Revenue',
            value: '₹4.5L',
            change: '+18%',
            trend: 'up',
            icon: TrendingUp
        },
    ];

    const recentActivity = [
        { type: 'user', message: 'New user registration: rahul@example.com', time: '2 min ago' },
        { type: 'query', message: 'High-value query processed for GST AI', time: '5 min ago' },
        { type: 'system', message: 'Knowledge base updated with 3 new circulars', time: '15 min ago' },
        { type: 'payment', message: 'Subscription upgraded: Pro tier', time: '32 min ago' },
        { type: 'alert', message: 'Low confidence query flagged for review', time: '1 hour ago' },
    ];

    const pendingTasks = [
        { title: 'Review surveillance findings', count: 12, priority: 'high', href: '/admin/surveillance' },
        { title: 'Knowledge gap suggestions', count: 0, priority: 'high', href: '/admin/knowledge-suggestions' },
        { title: 'Update GST AI knowledge base', count: 3, priority: 'low', href: '/admin/knowledge-bases' },
    ];

    return (
        <div className="lg:pl-64">
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with Karr AI Global.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.name} className="card p-6">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {stat.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                        {stat.change}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-sm text-gray-500">{stat.name}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 card">
                        <div className="card-header">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                        </div>
                        <div className="card-body">
                            <div className="space-y-4">
                                {recentActivity.map((activity, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={`w-2 h-2 mt-2 rounded-full ${activity.type === 'alert' ? 'bg-yellow-500' :
                                            activity.type === 'payment' ? 'bg-green-500' :
                                                'bg-blue-500'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900">{activity.message}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <Clock className="w-3 h-3" />
                                                {activity.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pending Tasks */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="text-lg font-semibold text-gray-900">Pending Tasks</h2>
                        </div>
                        <div className="card-body">
                            <div className="space-y-3">
                                {pendingTasks.map((task, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {task.priority === 'high' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                            <span className="text-sm text-gray-900">{task.title}</span>
                                        </div>
                                        <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                                            {task.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="flex flex-wrap gap-3">
                        <a href="/admin/knowledge-bases/new" className="btn-primary">
                            Create Knowledge Base
                        </a>
                        <a href="/admin/products/new" className="btn-outline">
                            Create AI Product
                        </a>
                        <a href="/admin/knowledge/upload" className="btn-outline">
                            Upload Documents
                        </a>
                        <a href="/admin/audit" className="btn-outline">
                            View Audit Logs
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
