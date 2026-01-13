import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../../services/rbacService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  MessageSquare,
  Target,
  ChevronRight,
  ArrowUpRight,
  Calendar
} from 'lucide-react';

const ClientDashboard = () => {
  const { currentUser } = useRBAC();
  const navigate = useNavigate();
  const [projectStats, setProjectStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    pendingRequests: 0,
    totalRequests: 0
  });

  const [recentUpdates, setRecentUpdates] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Mock data - replace with actual API calls
    setProjectStats({
      activeProjects: 3,
      completedProjects: 8,
      pendingRequests: 2,
      totalRequests: 15
    });

    setRecentUpdates([
      {
        id: 1,
        type: 'project_update',
        title: 'Website Redesign - Homepage Complete',
        message: 'The homepage design has been completed and is ready for review.',
        timestamp: '2024-01-15T14:30:00Z',
        project: 'Website Redesign'
      },
      {
        id: 2,
        type: 'request_response',
        title: 'Content Update Request - Responded',
        message: 'Your request for content updates has been addressed by the editor.',
        timestamp: '2024-01-14T16:45:00Z',
        project: 'Blog Content'
      },
      {
        id: 3,
        type: 'project_milestone',
        title: 'Marketing Materials - 75% Complete',
        message: 'Your marketing materials project has reached 75% completion.',
        timestamp: '2024-01-13T11:20:00Z',
        project: 'Marketing Materials'
      }
    ]);

    setActiveProjects([
      {
        id: 1,
        name: 'Website Redesign',
        progress: 85,
        status: 'in_progress',
        dueDate: '2024-01-25',
        editor: 'John Editor',
        lastUpdate: '2024-01-15T14:30:00Z'
      },
      {
        id: 2,
        name: 'Blog Content Creation',
        progress: 60,
        status: 'in_progress',
        dueDate: '2024-01-30',
        editor: 'Jane Writer',
        lastUpdate: '2024-01-14T16:45:00Z'
      },
      {
        id: 3,
        name: 'Marketing Materials',
        progress: 75,
        status: 'review',
        dueDate: '2024-01-20',
        editor: 'Mike Designer',
        lastUpdate: '2024-01-13T11:20:00Z'
      }
    ]);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5 }}
      className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 relative overflow-hidden group hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className={`absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
        <Icon size={100} className={`text-${color}-500`} />
      </div>

      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600 dark:text-${color}-400 mb-4 ring-1 ring-${color}-100 dark:ring-${color}-900/30`}>
          <Icon size={24} />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
      </div>
    </motion.div>
  );

  const getUpdateIcon = (type) => {
    switch (type) {
      case 'project_update': return RefreshCw;
      case 'request_response': return MessageSquare;
      case 'project_milestone': return Target;
      default: return FileText;
    }
  };

  const getStatusColor = (status) => {
    const styles = {
      in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      on_hold: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
    };
    return styles[status] || styles.on_hold;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8"
    >
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track your projects and request updates in real-time.
          </p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40">
          <FileText size={18} />
          <span>New Request</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Projects"
          value={projectStats.activeProjects}
          icon={LayoutDashboard}
          color="indigo"
          onClick={() => navigate('progress')}
        />
        <StatCard
          title="Completed Projects"
          value={projectStats.completedProjects}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Pending Requests"
          value={projectStats.pendingRequests}
          icon={Clock}
          color="amber"
          onClick={() => navigate('requests')}
        />
        <StatCard
          title="Total Requests"
          value={projectStats.totalRequests}
          icon={FileText}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Projects */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Projects</h2>
            <button
              onClick={() => navigate('progress')}
              className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {activeProjects.map((project) => (
              <motion.div
                key={project.id}
                whileHover={{ scale: 1.01 }}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60 transition-all hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-100 dark:ring-indigo-900/30">
                      <LayoutDashboard size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{project.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1"><Calendar size={14} /> Due {formatDate(project.dueDate)}</span>
                        <span>•</span>
                        <span>{project.editor}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)} self-start md:self-center`}>
                    {project.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-300 ring-1 ring-indigo-100 dark:ring-indigo-900/30">
                        Progress
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-indigo-600 dark:text-indigo-400">
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-slate-100 dark:bg-slate-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"
                    ></motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Updates */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Updates</h2>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <RefreshCw size={18} className="text-slate-500" />
            </button>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
            {recentUpdates.map((update, index) => {
              const Icon = getUpdateIcon(update.type);
              return (
                <div
                  key={update.id}
                  className={`p-6 border-b border-slate-200/60 dark:border-slate-700/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors`}
                >
                  <div className="flex gap-4">
                    <div className="mt-1">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <Icon size={14} />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{update.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{update.project}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                        {update.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(update.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 text-center border-t border-slate-200/60 dark:border-slate-700/60">
              <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                View All Notifications
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ClientDashboard;
