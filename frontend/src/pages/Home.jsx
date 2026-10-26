import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileSearch, Mail, MessageSquare, Target, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';
import DatabaseStatus from '../components/DatabaseStatus';

const FeatureCard = ({ title, description, icon, path, color }) => (
  <motion.div
    whileHover={{ y: -10 }}
    className="glass-card rounded-3xl p-8 flex flex-col h-full group"
  >
    <div className={`${color} p-4 rounded-2xl w-fit mb-6 text-white group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="text-2xl mb-4">{title}</h3>
    <p className="text-slate-500 mb-8 flex-1 leading-relaxed">
      {description}
    </p>
    <Link 
      to={path} 
      className="inline-flex items-center gap-2 text-primary-600 font-bold group-hover:gap-3 transition-all"
    >
      Get Started <ArrowRight size={20} />
    </Link>
  </motion.div>
);

const Home = () => {
  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary-200/30 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-3xl -z-10 animate-float" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-bold mb-8 border border-primary-100">
              <Sparkles size={16} /> AI-Powered Career Excellence
            </span>
            <h1 className="text-5xl md:text-7xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-primary-800 to-slate-900 leading-tight">
              Master Your Next <br />
              <span className="gradient-text">Big Interview</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
              Unlock your full potential with our advanced AI suite. Analyze resumes, generate tailored cover letters, and practice interviews with real-time feedback.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/resume" className="btn-premium w-full sm:w-auto px-10 h-16 text-lg shadow-blue-500/30">
                Analyze My Resume
              </Link>
              <Link to="/interview" className="btn-secondary w-full sm:w-auto px-10 h-16 text-lg">
                Practice Interview
              </Link>
            </div>
          </motion.div>

          {/* Stats/Badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-20 flex flex-wrap justify-center gap-12 grayscale opacity-50"
          >
            <div className="flex items-center gap-2 font-bold"><Zap size={20} /> Instant Analysis</div>
            <div className="flex items-center gap-2 font-bold"><Shield size={20} /> Privacy First</div>
            <div className="flex items-center gap-2 font-bold"><Target size={20} /> High Accuracy</div>
          </motion.div>
        </div>
      </section>

      {/* Live database status */}
      <DatabaseStatus />

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl mb-4">Everything You Need to Succeed</h2>
          <p className="text-slate-500">Comprehensive tools designed to give you the ultimate competitive edge.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            title="Resume Analyzer"
            description="Get a detailed ATS score, identify missing keywords, and receive professional improvement suggestions."
            icon={<FileSearch size={28} />}
            path="/resume"
            color="bg-blue-500"
          />
          <FeatureCard
            title="Cover Letter"
            description="Generate high-impact, tailored cover letters that align perfectly with the job description and your skills."
            icon={<Mail size={28} />}
            path="/cover-letter"
            color="bg-purple-500"
          />
          <FeatureCard
            title="Interview Prep"
            description="Generate realistic technical and HR questions based on your profile and target job role."
            icon={<MessageSquare size={28} />}
            path="/interview"
            color="bg-indigo-500"
          />
          <FeatureCard
            title="Answer Scorer"
            description="Practice your answers and get scored on relevancy, STAR method, and communication style."
            icon={<Target size={28} />}
            path="/practice"
            color="bg-rose-500"
          />
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-[3rem] p-12 md:p-24 relative overflow-hidden text-center text-white">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-600/20 to-purple-600/20 -z-0" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl mb-8">Ready to Land Your Dream Job?</h2>
            <p className="text-slate-400 text-lg mb-12">
              Join thousands of job seekers who use AI Interview Ready to sharpen their skills and boost their confidence.
            </p>
            <Link to="/resume" className="btn-premium inline-flex px-12 h-16 text-lg bg-white text-primary-600 hover:bg-slate-100 shadow-none border-none">
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
