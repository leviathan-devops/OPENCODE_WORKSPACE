/**
 * V4 Agent Factory - Basic Usage Example
 * 
 * Demonstrates how to use the V4 factory system to create and use
 * configurable agent architectures.
 */

import { createArchitecture, createSpiderArchitecture } from '../src';

async function main() {
  console.log('=== V4 Agent Factory Basic Usage Example ===\n');
  
  // Example 1: Create Spider architecture from config file
  console.log('1. Creating Spider architecture from config file...');
  try {
    const spider = await createArchitecture({
      config: './ARCHITECTURES/spider.json',
      context: { workspace: '/tmp/test-workspace' }
    });
    
    console.log(`   ✓ Created architecture: ${spider.name} (${spider.id})`);
    console.log(`   - Brains: ${spider.brains.length} (${spider.brains.map(b => b.config.name).join(', ')})`);
    console.log(`   - Clusters: ${spider.clusters.length}`);
    console.log(`   - Agents: ${spider.agents.length}`);
    console.log(`   - Workflows: ${spider.workflows.length}`);
    console.log(`   - Coordination: ${spider.coordination ? 'Initialized' : 'Not initialized'}\n`);
    
    // Access a brain instance
    const orchestrator = spider.brains[0];
    console.log(`   Brain example: ${orchestrator.config.name}`);
    console.log(`   - Type: ${orchestrator.config.type}`);
    console.log(`   - Coordinates clusters: ${orchestrator.config.coordinatesClusters.length}\n`);
    
  } catch (error) {
    console.error(`   ✗ Error creating Spider architecture: ${error}`);
  }
  
  // Example 2: Use quick start function
  console.log('2. Using quick start function for Spider architecture...');
  try {
    const spiderQuick = await createSpiderArchitecture({
      workspace: '/tmp/test-workspace-2'
    });
    
    console.log(`   ✓ Quick start successful: ${spiderQuick.name}\n`);
    
    // Demonstrate agent access
    const architectAgent = spiderQuick.agents.find(a => a.id === 'architect');
    if (architectAgent) {
      console.log(`   Agent example: ${architectAgent.config.name}`);
      console.log(`   - Type: ${architectAgent.config.type}`);
      console.log(`   - Cluster: ${architectAgent.config.clusterId}`);
      console.log(`   - Capabilities: ${architectAgent.config.capabilities.slice(0, 3).join(', ')}...\n`);
    }
    
  } catch (error) {
    console.error(`   ✗ Error with quick start: ${error}\n`);
  }
  
  // Example 3: List available architectures
  console.log('3. Available architectures:');
  const { getAvailableArchitectures, loadArchitectureConfig } = await import('../src');
  const architectures = getAvailableArchitectures();
  
  for (const archId of architectures) {
    try {
      const config = await loadArchitectureConfig(archId);
      console.log(`   - ${config.name} (${archId}): ${config.description}`);
    } catch (error) {
      console.log(`   - ${archId}: Could not load config`);
    }
  }
  console.log('');
  
  // Example 4: Factory component usage
  console.log('4. Using individual factories...');
  try {
    const { BrainFactory, ClusterFactory, AgentFactory } = await import('../src');
    
    const brainFactory = new BrainFactory();
    const clusterFactory = new ClusterFactory();
    const agentFactory = new AgentFactory();
    
    console.log(`   - Available brain types: ${brainFactory.getAvailableBrainTypes().join(', ')}`);
    console.log(`   - Available cluster types: ${clusterFactory.getAvailableClusterTypes().join(', ')}`);
    console.log(`   - Available agent types: ${agentFactory.getAvailableAgentTypes().join(', ')}\n`);
    
  } catch (error) {
    console.error(`   ✗ Error with factories: ${error}\n`);
  }
  
  // Example 5: Workflow demonstration
  console.log('5. Workflow demonstration...');
  try {
    const spider = await createSpiderArchitecture();
    const workflow = spider.workflows[0];
    
    if (workflow) {
      console.log(`   Workflow: ${workflow.config.name}`);
      console.log(`   - Phases: ${workflow.config.phases.length}`);
      console.log(`   - Gates: ${workflow.config.gates.length}`);
      
      // Start the workflow
      const startResult = workflow.instance.start();
      console.log(`   - Started workflow: ${startResult.started ? 'Yes' : 'No'}`);
      console.log(`   - Current phase: ${startResult.currentPhase}\n`);
    }
    
  } catch (error) {
    console.error(`   ✗ Error with workflow: ${error}\n`);
  }
  
  console.log('=== Example Complete ===');
  console.log('\nNext steps:');
  console.log('1. Create your own architecture configuration in ARCHITECTURES/');
  console.log('2. Use migrate.sh to customize the keyword (e.g., ./MIGRATION/migrate.sh shark)');
  console.log('3. Extend factories with custom component types');
  console.log('4. Integrate with your existing agent system');
}

// Run the example
main().catch(console.error);