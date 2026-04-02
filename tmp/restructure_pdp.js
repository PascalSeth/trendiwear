const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', '(pages)', 'shopping', 'products', '[id]', 'ProductClient.tsx');

let content = fs.readFileSync(filePath, 'utf-8');

const splitStr = '      {/* Immersive Artisan "Interlude" Section - Redesigned for Creative Impact */}';
if (content.includes(splitStr)) {
    const parts = content.split(splitStr);
    const pre = parts[0];
    
    const newEnd = `      {/* 1. In Motion - Video Showcase */}
      {product.videoUrl && (
         <div className="w-full bg-[#FAFAF9] py-16 md:py-24 border-b border-stone-100 text-center relative overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 flex flex-col items-center gap-8 relative z-10">
                 <div className="space-y-4 max-w-2xl mx-auto">
                     <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400 font-mono">The Showcase</p>
                     <h3 className="text-3xl md:text-5xl font-serif italic tracking-tighter text-stone-900">In Motion</h3>
                 </div>
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}
                    className="w-full max-w-[900px] aspect-video rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-stone-900/10 bg-[#E8E8E8]"
                 >
                    <video 
                       src={product.videoUrl} 
                       autoPlay 
                       loop 
                       muted 
                       controls
                       playsInline 
                       className="w-full h-full object-cover transition-transform hover:scale-105 duration-1000" 
                    />
                 </motion.div>
            </div>
         </div>
      )}

      {/* 2. Sleek Artisan / Designer Banner */}
      {product.professional?.professionalProfile && (
         <section className="w-full py-16 md:py-24 bg-white border-b border-stone-100 relative">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
               <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="lg:col-span-5 relative group">
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-lg ring-1 ring-black/5">
                     {product.professional.professionalProfile.businessImage ? (
                        <Image 
                           src={product.professional.professionalProfile.businessImage} 
                           alt="Atelier" 
                           fill 
                           className="object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105" 
                        />
                     ) : (
                        <div className="w-full h-full bg-stone-50 flex items-center justify-center text-stone-300 italic serif text-2xl">Atelier</div>
                     )}
                  </div>
               </motion.div>

               <div className="lg:col-span-7 space-y-8">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-[0.5em] text-red-900/40 font-mono">Designed By</p>
                     <h3 className="text-4xl md:text-5xl font-serif italic tracking-tighter text-stone-900">
                        {product.professional.professionalProfile.businessName}
                     </h3>
                  </div>
                  <p className="text-lg md:text-xl font-serif text-stone-600 leading-relaxed italic border-l-2 border-stone-100 pl-6 max-w-2xl">
                     &ldquo;{product.professional.professionalProfile.bio || "Every piece tells a story of heritage, precision, and the pursuit of timeless elegance."}&rdquo;
                  </p>
                  <div className="flex items-center gap-8 pt-4">
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Provenance</p>
                        <div className="flex items-center gap-1.5 text-stone-950 font-mono text-xs uppercase tracking-widest mt-1">
                           <MapPin size={12} className="text-red-900" />
                           {product.professional.professionalProfile.location || "Accra"}
                        </div>
                     </div>
                     <div className="h-8 w-px bg-stone-200" />
                     <Link 
                        href={\`/tz/\${product.professional.professionalProfile.slug}\`} 
                        className="group inline-flex h-12 px-8 bg-stone-950 text-white rounded-full items-center justify-center transition-all hover:bg-black hover:scale-[1.02] active:scale-95 shadow-lg shadow-stone-900/10"
                     >
                        <span className="text-[10px] font-black uppercase tracking-widest">Visit Atelier</span>
                        <ArrowRight size={14} className="ml-3 group-hover:translate-x-1 transition-transform" />
                     </Link>
                  </div>
               </div>
            </div>
         </section>
      )}

      {/* 3. Review Section (Last) */}
      <div className="w-full bg-[#FAFAF9] py-20 md:py-28" ref={reviewsRef}>
         <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-32 h-fit">
               <ProductReviewForm 
                 productId={product.id}
                 isLoggedIn={isLoggedIn}
                 hasPurchased={hasPurchased}
                 hasReviewed={userHasReviewed}
                 onSuccess={async () => {
                    const res = await fetch(\`/api/reviews?targetId=\${product.id}&targetType=PRODUCT\`)
                    const data = await res.json()
                    if (res.ok) {
                       setReviews(data.reviews)
                       setUserHasReviewed(true)
                    }
                 }}
               />
               <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 px-6 border-l border-stone-200">
                  Sharing your experience helps artisans improve and helps buyers decide.
               </p>
            </div>
            
            <div className="lg:col-span-8 space-y-12">
               <div className="flex items-end justify-between border-b border-stone-200 pb-6">
                  <h3 className="text-4xl font-serif italic tracking-tighter">Buyer Tales</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">{reviews.length} Experiences</span>
                  </div>
               </div>
               
               <div className="space-y-8">
                  {reviews.length > 0 ? (
                    reviews.map(r => (
                       <motion.div key={r.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-5 border-b border-stone-100 pb-10 last:border-0">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-white border border-stone-100 flex items-center justify-center font-mono text-[10px] text-stone-400 uppercase shadow-sm">
                                   {r.user.firstName[0]}{r.user.lastName[0]}
                                </div>
                                <div>
                                   <p className="text-[10px] font-black uppercase tracking-widest text-stone-900">{r.user.firstName} {r.user.lastName.slice(0, 1)}.</p>
                                   <p className="text-[8px] font-mono uppercase tracking-widest text-stone-400">
                                      {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                   </p>
                                </div>
                             </div>
                             <div className="flex items-center gap-2 text-[9px] font-bold tracking-widest uppercase">
                                <div className="flex items-center gap-0.5">
                                   {[1, 2, 3, 4, 5].map((s) => (
                                      <Star key={s} size={10} fill={s <= r.rating ? "currentColor" : "none"} className={s <= r.rating ? "text-amber-500" : "text-stone-200"} />
                                   ))}
                                </div>
                                {r.isVerified && <span className="text-[8px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">Verified</span>}
                             </div>
                          </div>
                          <p className="text-lg font-serif italic text-stone-700 leading-relaxed max-w-2xl">
                             &ldquo;{r.comment}&rdquo;
                          </p>

                          <div className="flex items-center gap-6 pt-2">
                             <button
                               onClick={() => setReplyingTo(replyingTo === r.id ? null : r.id)}
                               className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-950 transition-colors"
                             >
                                <Reply size={12} />
                                {replyingTo === r.id ? 'Cancel' : 'Reply'}
                             </button>
                          </div>

                          <div className="space-y-4 mt-4">
                             <AnimatePresence>
                                {replyingTo === r.id && (
                                   <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="ml-6 lg:ml-12 overflow-hidden">
                                      <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
                                         <textarea
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder="Join the conversation..."
                                            className="w-full bg-transparent border-none p-0 text-sm font-serif italic text-stone-700 focus:ring-0 resize-none min-h-[60px]"
                                         />
                                         <div className="flex justify-end gap-3">
                                            <button
                                               onClick={() => setReplyingTo(null)}
                                               className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600"
                                            >
                                               Discard
                                            </button>
                                            <button
                                               disabled={isSubmittingReply || !replyContent.trim()}
                                               onClick={() => handleReplySubmit(r.id)}
                                               className="px-6 py-2 bg-stone-950 text-white text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-black transition-all disabled:opacity-30"
                                            >
                                               {isSubmittingReply ? 'Posting...' : 'Share Reply'}
                                            </button>
                                         </div>
                                      </div>
                                   </motion.div>
                                )}
                             </AnimatePresence>

                             {r.replies?.map(reply => {
                                const isSeller = reply.user.id === product.professional.id;
                                return (
                                   <motion.div key={reply.id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="ml-6 lg:ml-12 p-5 bg-stone-50/50 rounded-2xl border-l border-stone-200 space-y-3">
                                      <div className="flex items-center justify-between">
                                         <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-white border border-stone-100 flex items-center justify-center font-mono text-[9px] text-stone-400 uppercase shadow-sm">
                                               {reply.user.firstName[0]}{reply.user.lastName[0]}
                                            </div>
                                            <div>
                                               <div className="flex items-center gap-2">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-900">{reply.user.firstName} {reply.user.lastName.slice(0, 1)}.</p>
                                                  {isSeller && (
                                                     <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">Seller</span>
                                                  )}
                                               </div>
                                               <p className="text-[8px] font-mono uppercase tracking-widest text-stone-400">
                                                  {new Date(reply.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                               </p>
                                            </div>
                                         </div>
                                      </div>
                                      <p className="text-[15px] font-serif italic text-stone-600 leading-relaxed">
                                         &ldquo;{reply.comment}&rdquo;
                                      </p>
                                   </motion.div>
                                )
                             })}
                          </div>
                       </motion.div>
                    ))
                  ) : (
                    <div className="py-16 text-center space-y-3 bg-white rounded-[2rem] border border-stone-100 shadow-sm">
                      <p className="text-stone-300 text-4xl font-serif italic">No tales yet...</p>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Be the first to share your experience with this piece.</p>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>

    </div>
  )
}
`;
    fs.writeFileSync(filePath, pre + newEnd, 'utf-8');
    console.log("Replaced successfully!");
} else {
    console.log("Could not find the target string :(");
}
