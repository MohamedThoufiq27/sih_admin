import AnalyticsPieChart from '../components/AnalyticPieChart'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import Map from '../components/Map'

const Dashboard = ({reports,setReports}) => {
  return (
    <main className="flex-1 p-8">
            {/* Page Header */}
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-400">Live Reports Dashboard</h1>
                <p className="mt-1 text-slate-500">Real-time overview of civic issues.</p>
            </div>
            
            {/* Analytics Section */}
            <div className="max-w-7xl mx-auto mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <AnalyticsDashboard/>
                </div>
                <div className="lg:col-span-1">
                  <AnalyticsPieChart />
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="max-w-7xl mx-auto mt-8">
               <div className="h-[50vh] bg-white rounded-xl shadow-md overflow-hidden">
                 <Map reports={reports} setReports={setReports} />
               </div>
            </div>
          </main>
  )
}

export default Dashboard