import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { Star, MessageSquare, RefreshCw, Award, Users, ThumbsUp, Calendar } from 'lucide-react';

const AdminFeedbackPage = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbackData();
  }, []);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/feedback');
      setFeedbackData(res.data);
    } catch (err) {
      console.error('Fetch feedback error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader
          title="Customer Feedback & Ratings"
          subtitle="Analyze star rating distribution, review comments, and overall customer satisfaction"
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <h2 className="font-[#Outfit] text-lg font-bold text-[#2C1810] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#8B5E3C]" /> Customer Rating Overview
            </h2>
            <button
              onClick={fetchFeedbackData}
              className="px-3.5 py-1.5 bg-white border border-[#D4A373]/30 text-[#8B5E3C] hover:bg-[#FAEDCD] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Reviews
            </button>
          </div>

          {loading || !feedbackData ? (
            <div className="py-16">
              <LoadingSpinner text="Compiling rating analytics & feedback feed..." />
            </div>
          ) : (
            <>
              {/* Analytics Header Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Average Rating Score Box */}
                <div className="bg-gradient-to-br from-[#2C1810] via-[#3C2A21] to-[#1A0F0A] text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-3">
                  <span className="text-xs font-bold text-[#D4A373] uppercase tracking-wider">
                    Average Customer Rating
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="font-[#Outfit] text-5xl font-extrabold">
                      {feedbackData.averageRating.toFixed(1)}
                    </span>
                    <div className="flex flex-col">
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(feedbackData.averageRating)
                                ? 'fill-amber-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-400 font-semibold mt-1">
                        Out of 5.0 Stars
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 pt-2 border-t border-white/10">
                    Based on {feedbackData.totalReviews} verified post-completion reviews
                  </p>
                </div>

                {/* Rating Distribution Breakdown */}
                <div className="md:col-span-2 bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-xs space-y-3">
                  <h3 className="font-[#Outfit] font-bold text-base text-[#2C1810]">
                    Star Rating Breakdown
                  </h3>

                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((starCount) => {
                      const count = feedbackData.distribution[starCount] || 0;
                      const percentage =
                        feedbackData.totalReviews > 0
                          ? Math.round((count / feedbackData.totalReviews) * 100)
                          : 0;

                      return (
                        <div key={starCount} className="flex items-center gap-3 text-xs">
                          <span className="w-12 font-bold text-[#2C1810] flex items-center gap-1 shrink-0">
                            {starCount} <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          </span>

                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 transition-all duration-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          <span className="w-16 text-right font-bold text-gray-500 text-[11px]">
                            {count} ({percentage}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Feedback Feed */}
              <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-xs space-y-4">
                <h3 className="font-[#Outfit] font-bold text-base text-[#2C1810]">
                  Customer Reviews Feed ({feedbackData.reviews.length})
                </h3>

                {feedbackData.reviews.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {feedbackData.reviews.map((rev) => {
                      const formattedDate = new Date(rev.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div key={rev._id} className="py-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#8B5E3C] text-white flex items-center justify-center font-bold text-xs">
                                {rev.customer?.name ? rev.customer.name.charAt(0) : 'C'}
                              </div>
                              <div>
                                <span className="font-bold text-[#2C1810] text-sm block">
                                  {rev.customer?.name || 'Customer'}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  {rev.customer?.email || 'N/A'}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="flex items-center justify-end text-amber-400">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3.5 h-3.5 ${
                                      star <= rev.rating ? 'fill-amber-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                {formattedDate}
                              </span>
                            </div>
                          </div>

                          <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#D4A373]/20 flex items-start justify-between gap-4 text-xs">
                            <p className="text-gray-700 italic">
                              "{rev.comment || 'No written comment provided.'}"
                            </p>

                            <div className="shrink-0 text-right">
                              <span className="font-mono text-[11px] text-[#8B5E3C] font-bold block">
                                Order #{rev.order?._id ? rev.order._id.substring(rev.order._id.length - 6) : 'N/A'}
                              </span>
                              {rev.order && (
                                <span className="text-[10px] text-gray-500 font-semibold">
                                  Table {rev.order.tableNumber} ({rev.order.floor})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-xs text-gray-400 py-8">
                    No customer feedback entries submitted yet.
                  </p>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminFeedbackPage;
