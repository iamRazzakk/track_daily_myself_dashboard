import { useNavigate } from 'react-router-dom';
import { formatTimeAgo } from '../../lib/utils';
import { Card, CardHeader, CardBody, Avatar } from '../ui';
import { ArrowRight } from 'lucide-react';

interface RecentUser {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface RecentUsersCardProps {
  users: RecentUser[];
}

export default function RecentUsersCard({ users }: RecentUsersCardProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
        <button
          onClick={() => navigate('/users')}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </button>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-gray-100">
          {users.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent users
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user._id}
                onClick={() => navigate(`/users/${user._id}`)}
                className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Avatar name={user.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <span className="text-xs text-gray-400">{formatTimeAgo(user.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
}
