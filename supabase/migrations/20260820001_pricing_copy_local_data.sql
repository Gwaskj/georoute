-- Stop the pricing table advertising cloud storage.
--
-- The Pro card listed "Cloud storage of staff and appointments" as a paid
-- feature. That storage no longer exists, so the most commercially important
-- page on the site was selling something deliberately removed -- and the Free
-- card's "Browser-based storage" read as a limitation rather than as the
-- guarantee it now is.
--
-- This copy lives in the database rather than in the repository, which is why
-- it survived a sweep of the codebase for exactly these claims.

update public.pricing
   set features = to_jsonb(array[
         'Up to 2 staff members',
         'Up to 10 appointments per day',
         'Route optimisation',
         'Your data never leaves your browser',
         'No account needed'
       ]),
       description = 'Try it on a real round'
 where plan = 'free';

update public.pricing
   set features = to_jsonb(array[
         'Unlimited staff',
         'Up to 100 appointments per day',
         'Route optimisation',
         'Calendar for recurring visits',
         'Share rounds with carers',
         'Your data never leaves your browser'
       ]),
       description = 'For teams running daily rounds'
 where plan = 'pro';
