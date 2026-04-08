import DashboardLayout from "../components/common/DashboardLayout";
import Navbar from "../components/common/Navbar";

const ComingSoon = () => {
    return (
        <DashboardLayout>
            <Navbar title="Under Construction" breadcrumb={["InfraPilot", "System", "Coming Soon"]} />
            <div className="p-8 bg-slate-50 min-h-screen flex items-center justify-center">
                <div className="bg-white rounded-[32px] p-12 shadow-md border border-slate-100 text-center max-w-md w-full">
                    <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-5xl">🏗️</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2 italic">Coming Soon</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        We're working hard to bring you this feature. Stay tuned for updates!
                    </p>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-2/3 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ComingSoon;
