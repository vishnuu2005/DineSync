import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Star, Send, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

const FeedbackForm = ({ orderId, isCompleted }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (orderId && isCompleted) {
      checkExistingFeedback();
    } else {
      setLoading(false);
    }
  }, [orderId, isCompleted]);

  const checkExistingFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/feedback/order/${orderId}`);
      if (res.data) {
        setExistingFeedback(res.data);
      }
    } catch (err) {
      console.error('Check feedback error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/feedback', {
        orderId,
        rating,
        comment,
      });
      setExistingFeedback(res.data);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isCompleted) {
    return (
      <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#D4A373]/20 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
        <MessageSquare className="w-4 h-4 text-[#8B5E3C]" />
        <span>Feedback & Star Ratings will unlock once your table order is marked <strong>Completed</strong>.</span>
      </div>
    );
  }

  if (loading) {
    return <div className="text-xs text-gray-400 text-center py-4">Checking feedback status...</div>;
  }

  if (existingFeedback || submitted) {
    const activeRating = existingFeedback ? existingFeedback.rating : rating;
    const activeComment = existingFeedback ? existingFeedback.comment : comment;

    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="font-[#Outfit] font-bold text-base text-emerald-900">
          Thank You for Your Feedback!
        </h4>

        {/* Star Display */}
        <div className="flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= activeRating
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>

        {activeComment && (
          <p className="text-xs text-emerald-800 italic bg-white/70 p-3 rounded-xl border border-emerald-100 max-w-md mx-auto">
            "{activeComment}"
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#D4A373]/30 p-6 shadow-sm space-y-4">
      <div className="text-center space-y-1">
        <h4 className="font-[#Outfit] font-extrabold text-lg text-[#2C1810]">
          How was your experience?
        </h4>
        <p className="text-xs text-gray-500">
          Rate your food quality and service to help us improve our café!
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Interactive Star Rating */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 focus:outline-none transition-transform hover:scale-125"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-xs font-bold text-[#8B5E3C] mt-1">
            {rating === 5 && '★★★★★ Excellent'}
            {rating === 4 && '★★★★☆ Very Good'}
            {rating === 3 && '★★★☆☆ Good'}
            {rating === 2 && '★★☆☆☆ Average'}
            {rating === 1 && '★☆☆☆☆ Poor'}
          </span>
        </div>

        {/* Written Comment */}
        <div>
          <label className="block text-xs font-bold text-[#2C1810] mb-1">
            Write your feedback / comment
          </label>
          <textarea
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts on food taste, coffee aroma, and service..."
            className="w-full p-3 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl text-xs text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-[#8B5E3C] hover:bg-[#6F492E] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Submitting Feedback...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;
