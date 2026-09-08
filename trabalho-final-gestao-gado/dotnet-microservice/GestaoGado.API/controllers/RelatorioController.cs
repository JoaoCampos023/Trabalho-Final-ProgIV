using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text;

[ApiController]
[Route("api/[controller]")]
public class RelatorioController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;

    public RelatorioController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet("producao")]
    public async Task<IActionResult> GetRelatorioProducao(
        [FromQuery] DateTime? dataInicio,
        [FromQuery] DateTime? dataFim,
        [FromQuery] int? animalBrinco)
    {
        // Chamar o Node.js para buscar dados
        var client = _httpClientFactory.CreateClient();
        var url = $"http://localhost:3000/api/producoes/relatorio?dataInicio={dataInicio}&dataFim={dataFim}&animalBrinco={animalBrinco}";
        
        var response = await client.GetAsync(url);
        var content = await response.Content.ReadAsStringAsync();
        var dados = JsonSerializer.Deserialize<object>(content);

        return Ok(new
        {
            success = true,
            data = dados,
            source = ".NET Microsserviço"
        });
    }

    [HttpGet("exportar/pdf")]
    public async Task<IActionResult> ExportarPDF(
        [FromQuery] DateTime? dataInicio,
        [FromQuery] DateTime? dataFim,
        [FromQuery] int? animalBrinco)
    {
        // Buscar dados do Node.js
        var client = _httpClientFactory.CreateClient();
        var url = $"http://localhost:3000/api/producoes/relatorio?dataInicio={dataInicio}&dataFim={dataFim}&animalBrinco={animalBrinco}";
        
        var response = await client.GetAsync(url);
        var content = await response.Content.ReadAsStringAsync();
        var dados = JsonSerializer.Deserialize<object>(content);

        // Gerar PDF (usando iTextSharp ou QuestPDF)
        var pdfBytes = GerarPDF(dados);
        
        return File(pdfBytes, "application/pdf", $"relatorio_{DateTime.Now:yyyyMMdd_HHmmss}.pdf");
    }

    private byte[] GerarPDF(object dados)
    {
        // Simulação - na prática use uma biblioteca como QuestPDF
        // return await new PdfGenerator().Generate(dados);
        return new byte[0];
    }
}