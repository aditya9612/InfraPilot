import { MapPin, User, ArrowRight } from "lucide-react";

interface Deployment {
    engineerName: string;
    projectName: string;
    status: "On Site" | "Travelling" | "Off Duty";
    lastActive: string;
}

const deployments: Deployment[] = [
    { engineerName: "Rahul Sharma", projectName: "Skyline Tower A", status: "On Site", lastActive: "10 mins ago" },
    { engineerName: "Priya Mehta", projectName: "Metro Ph-II", status: "Travelling", lastActive: "1 hour ago" },
    { engineerName: "Amit Kumar", projectName: "Grand Vista", status: "On Site", lastActive: "25 mins ago" },
    { engineerName: "Sana Khan", projectName: "HQ Block", status: "Off Duty", lastActive: "Yesterday" },
];

const ResourceOrchestrator = () => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-slate-800">Resource Orchestration</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Real-time Engineer Site Presence</p>
                </div>
                <button className="p-2 bg-slate-50 text-slate-400 hover:text-primary rounded-lg transition-colors">
                    <MapPin className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-4">
                {deployments.map((d, index) => (
                    <div key={index} className="flex items-center justify-between group p-2 hover:bg-slate-50 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${d.status === "On Site" ? "bg-emerald-100 text-emerald-600" : d.status === "Travelling" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                                }`}>
                                {d.engineerName.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-700">{d.engineerName}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${d.status === "On Site" ? "bg-emerald-500 animate-pulse" : d.status === "Travelling" ? "bg-blue-500" : "bg-slate-300"
                                        }`} />
                                    <p className="text-[10px] text-slate-400 font-medium">{d.projectName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.status === "On Site" ? "bg-emerald-50 text-emerald-600" : d.status === "Travelling" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                                }`}>
                                {d.status}
                            </span>
                            <span className="text-[9px] text-slate-300 mt-1">{d.lastActive}</span>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-6 py-2.5 text-xs font-bold text-slate-600 border border-slate-100 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-2 group">
                Manage Deployments
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
};

export default ResourceOrchestrator;
