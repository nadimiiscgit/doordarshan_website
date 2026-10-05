(function () {
  'use strict';
  const field = id => document.getElementById(`content-${id}`);
  let currentRow = null;
  function ids(input) {
    const values = input.split(',').map(v => v.trim()).filter(Boolean);
    if (values.length > 4 || values.some(v => !/^\d+$/.test(v))) throw new Error('Use at most four numeric product IDs per section.');
    const result = [...new Set(values.map(Number))];
    if (result.length !== values.length) throw new Error('Product IDs must not repeat within a section.');
    for (const id of result) {
      const product = liveProducts.find(p => Number(p.id) === id);
      if (!product || product.isApproved !== true) throw new Error(`Product ${id} is not approved for the public site.`);
    }
    return result;
  }
  function values() {
    const phone = field('phone').value.replace(/\D/g, '');
    const whatsapp = field('whatsapp').value.replace(/\D/g, '');
    if (!/^\d{10,15}$/.test(phone) || !/^\d{10,15}$/.test(whatsapp)) throw new Error('Enter valid 10–15 digit contact numbers, including country code.');
    const storeImage = field('store-image').value.trim();
    if (storeImage && !safeImageUrl(storeImage)) throw new Error('The showroom image must use a valid HTTPS URL.');
    const address = field('address').value.trim();
    if (!address || address.length > 300) throw new Error('Enter a store address under 300 characters.');
    const intro = field('intro').value.trim();
    if (intro.length > 600) throw new Error('Keep the store introduction under 600 characters.');
    const heroTitle = field('hero-title').value.trim();
    const heroEmphasis = field('hero-emphasis').value.trim();
    const heroDescription = field('hero-description').value.trim();
    if (!heroTitle || !heroEmphasis || !heroDescription || heroTitle.length > 80 || heroEmphasis.length > 80 || heroDescription.length > 350) throw new Error('Complete the homepage headline and introduction within their length limits.');
    return { phone, whatsapp, address, intro, store_image: storeImage,
      hero_title: heroTitle, hero_emphasis: heroEmphasis, hero_description: heroDescription,
      featured_ids: ids(field('featured').value), new_ids: ids(field('new').value) };
  }
  function populate(data) {
    field('phone').value = data.phone || '';
    field('whatsapp').value = data.whatsapp || '';
    field('address').value = data.address || '';
    field('intro').value = data.intro || '';
    field('hero-title').value = data.hero_title || 'Good electronics.';
    field('hero-emphasis').value = data.hero_emphasis || 'Helpful people.';
    field('hero-description').value = data.hero_description || 'Explore the range, then talk with our team before you decide. We’ll confirm the current price, availability and delivery options personally.';
    field('store-image').value = data.store_image || '';
    field('featured').value = (data.featured_ids || []).join(', ');
    field('new').value = (data.new_ids || []).join(', ');
  }
  window.loadSiteContentEditor = async function () {
    try {
      currentRow = await fetchEditableSiteContent();
      populate(currentRow.draft || currentRow.published || {});
      field('status').textContent = `Published version ${currentRow.version || 0}${currentRow.published_at ? ` · ${new Date(currentRow.published_at).toLocaleString()}` : ' · not published yet'}`;
    } catch (error) {
      field('status').textContent = 'Site content is not available. Apply and verify the database migration first.';
    }
  };
  window.saveSiteDraft = async function () {
    if (!await ensureAdminWriteReady()) return false;
    try {
      const draft = values();
      await saveSiteContentDraft(draft);
      localStorage.setItem('site-content-preview', JSON.stringify(draft));
      toast('Draft saved. It is not live yet.'); return true;
    } catch (error) { toast(error.message, 'error'); return false; }
  };
  window.previewSiteDraft = async function () {
    try {
      localStorage.setItem('site-content-preview', JSON.stringify(values()));
      window.open('index.html?preview=1', '_blank', 'noopener');
    } catch (error) { toast(error.message, 'error'); }
  };
  window.publishSiteDraft = async function () {
    if (!await window.saveSiteDraft()) return;
    if (!confirm('Publish this content to the public website?')) return;
    try { await publishSiteContent(); await window.loadSiteContentEditor(); toast('Site content published.'); }
    catch (error) { toast(`Publish failed: ${error.message}`, 'error'); }
  };
  window.restoreSiteVersion = async function () {
    if (!await ensureAdminWriteReady() || !confirm('Restore the previous published content?')) return;
    try { await restoreSiteContent(); await window.loadSiteContentEditor(); toast('Previous version restored.'); }
    catch (error) { toast(`Restore failed: ${error.message}`, 'error'); }
  };
  document.getElementById('content-store-file').addEventListener('change', async event => {
    if (!await ensureAdminWriteReady()) return;
    try { field('store-image').value = await uploadProductImageToStorage(event.target.files[0]); toast('Showroom photo uploaded. Save and publish to make it visible.'); }
    catch (error) { toast(error.message, 'error'); }
  });
  document.getElementById('cat-image-file').addEventListener('change', async event => {
    if (!await ensureAdminWriteReady()) return;
    try { document.getElementById('cat-image-input').value = await uploadProductImageToStorage(event.target.files[0]); toast('Category photo uploaded. Save the category to use it.'); }
    catch (error) { toast(error.message, 'error'); }
  });
})();
