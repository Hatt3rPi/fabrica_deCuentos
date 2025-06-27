// Script temporal para debuggear export_url en pedidos
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugExportUrls() {
  console.log('🔍 Debuggeando export_url en pedidos...\n');

  // 1. Probar consulta directa a la tabla stories
  console.log('1. Consultando tabla stories directamente:');
  const { data: storiesData, error: storiesError } = await supabase
    .from('stories')
    .select('id, title, status, export_url')
    .eq('status', 'completed')
    .limit(5);

  if (storiesError) {
    console.error('❌ Error en stories:', storiesError);
  } else {
    console.log('✅ Stories data:', storiesData?.map(s => ({
      id: s.id,
      title: s.title,
      export_url: s.export_url ? 'SÍ TIENE' : 'NO TIENE'
    })));
  }

  console.log('\n2. Consultando vista pedidos_view:');
  
  // 2. Probar consulta a la vista pedidos_view
  const { data: pedidosData, error: pedidosError } = await supabase
    .from('pedidos_view')
    .select('id, title, export_url')
    .limit(5);

  if (pedidosError) {
    console.error('❌ Error en pedidos_view:', pedidosError);
  } else {
    console.log('✅ Pedidos_view data:', pedidosData?.map(p => ({
      id: p.id,
      title: p.title,
      export_url: p.export_url ? 'SÍ TIENE' : 'NO TIENE'
    })));
  }

  console.log('\n3. Verificando que la vista existe:');
  
  // 3. Verificar que la vista existe
  const { data: viewData, error: viewError } = await supabase
    .rpc('sql', { 
      query: "SELECT table_name FROM information_schema.views WHERE table_name = 'pedidos_view'" 
    });

  if (viewError) {
    console.error('❌ Error verificando vista:', viewError);
  } else {
    console.log('✅ Vista existe:', viewData?.length > 0 ? 'SÍ' : 'NO');
  }
}

debugExportUrls().catch(console.error);