
import { Business, BusinessReview, SpecialOffer } from "@/types/business";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Phone, Globe, Mail, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BusinessDrawerProps {
  business: Business | null;
  onClose: () => void;
}

export const BusinessDrawer = ({ business, onClose }: BusinessDrawerProps) => {
  const { data: reviews } = useQuery({
    queryKey: ['business-reviews', business?.id],
    queryFn: async (): Promise<BusinessReview[]> => {
      if (!business) return [];
      const { data, error } = await supabase
        .from('business_reviews')
        .select('*')
        .eq('business_id', business.id);

      if (error) throw error;
      return data;
    },
    enabled: !!business
  });

  const { data: offers } = useQuery({
    queryKey: ['special-offers', business?.id],
    queryFn: async (): Promise<SpecialOffer[]> => {
      if (!business) return [];
      const { data, error } = await supabase
        .from('special_offers')
        .select('*')
        .eq('business_id', business.id)
        .gte('end_date', new Date().toISOString());

      if (error) throw error;
      return data;
    },
    enabled: !!business
  });

  if (!business) return null;

  const averageRating = reviews?.length 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
    : 0;

  return (
    <Sheet open={!!business} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">{business.name}</SheetTitle>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(averageRating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              ({reviews?.length || 0} reviews)
            </span>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
              <p>{business.address}</p>
            </div>
            {business.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <a href={`tel:${business.phone}`} className="text-blue-600 hover:underline">
                  {business.phone}
                </a>
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Website
                </a>
              </div>
            )}
            {business.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <a href={`mailto:${business.email}`} className="text-blue-600 hover:underline">
                  {business.email}
                </a>
              </div>
            )}
          </div>

          {offers && offers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Special Offers
              </h3>
              <div className="space-y-4">
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="p-4 border rounded-lg bg-yellow-50 border-yellow-200"
                  >
                    <h4 className="font-semibold text-yellow-800">{offer.title}</h4>
                    <p className="text-sm text-yellow-700 mt-1">{offer.description}</p>
                    <p className="text-xs text-yellow-600 mt-2">
                      Valid until {new Date(offer.end_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reviews && reviews.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Reviews</h3>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-gray-600">{review.comment}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
